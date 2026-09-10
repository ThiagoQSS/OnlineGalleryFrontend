# Guia de Integração Frontend com a API (File Management Microservice)

Este documento serve como especificação técnica detalhada para o desenvolvimento e integração do **Front-end** com o microsserviço de **Gerenciamento de Arquivos e Álbuns** (`file-management-ms`) da plataforma **OnlineGallery**.

---

## 1. Visão Geral da Arquitetura

O microsserviço atua como o ponto de entrada principal (BFF - Backend for Frontend) para o gerenciamento de mídias, álbuns e controle de usuários da galeria.

```
┌─────────────────┐       HTTP / REST (JWT / Cookie)      ┌─────────────────────────────┐
│                 ├──────────────────────────────────────►│     file-management-ms      │
│  Front-end App  │◄──────────────────────────────────────┤  (Spring Boot / Java 21)    │
│  (React/Vue/etc)│       Presigned URL Direta (GET)      └────────┬───────────────┬────┘
│                 ├───────────────────────────────────┐            │               │
└─────────────────┘                                   ▼            ▼               ▼
                                                ┌───────────┐┌───────────┐ ┌───────────────┐
                                                │  MinIO /  ││ PostgreSQL│ │   RabbitMQ    │
                                                │  AWS S3   ││  Database │ │ (Disparo de   │
                                                └───────────┘└───────────┘ │  e-mails ms)  │
                                                                           └───────────────┘
```

### Princípios Chave de Integração:
1. **Consumo de Imagens via Presigned URLs**: As respostas da API fornecem URLs pré-assinadas geradas via AWS SDK (apontando para MinIO em desenvolvimento ou S3 em produção). O front-end pode utilizar essas URLs diretamente em tags `<img>` ou links de download sem precisar enviar cabeçalhos de autenticação.
2. **Delegação Assíncrona de E-mails**: Ações como cadastro de usuário e convites para álbuns disparam eventos via RabbitMQ de forma assíncrona. O front-end não precisa orquestrar o envio de e-mails nem esperar respostas de servidores SMTP.
3. **Download Direto ou Compactado**: O backend possui endpoints dedicados para download individual ou compactação em lote (`.zip`) de imagens e álbuns inteiros.
4. **Página de Convite**: O e-mail de convite direciona o convidado para `${FRONTEND_URL}/albuns/convite?token=<uuid>`. O front-end deve capturar esse token na query param para renderizar as informações e a capa pública do álbum.

---

## 2. Autenticação e Segurança

A API adota autenticação **Stateless baseada em JWT**, oferecendo suporte a dois modos de envio do token (o front-end pode usar o que for mais conveniente, ou ambos):

### Modo 1: Cookie HttpOnly (Recomendado para Navegadores)
* Ao efetuar login com sucesso (`POST /auth/login`), a API retorna o header `Set-Cookie`:
  ```http
  Set-Cookie: gallery_token=<token_jwt>; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax
  ```
* **Requisito no Front-end**: Todas as requisições (via Axios ou Fetch) devem habilitar o envio de credenciais entre origens:
  * **Axios**: `axios.defaults.withCredentials = true;`
  * **Fetch**: `fetch(url, { credentials: 'include', ... })`
* Ao fazer logout (`POST /auth/logout`), o cookie é automaticamente invalidado (`Max-Age=0`).

### Modo 2: Header Authorization Bearer
* O corpo da resposta de `POST /auth/login` também inclui o campo `token` (String).
* O front-end pode armazenar esse token e passá-lo manualmente nos cabeçalhos HTTP:
  ```http
  Authorization: Bearer <seu_token_jwt>
  ```

### Política de CORS e Variáveis de Ambiente
* Em desenvolvimento, certifique-se de configurar a URL base da API:
  * Variável de ambiente recomendada no front-end: `VITE_API_BASE_URL` ou `NEXT_PUBLIC_API_BASE_URL`.
  * Exemplo: `http://localhost:8080` (ou a porta alocada pelo Eureka / Gateway).

---

## 3. Tipos e Modelos (TypeScript Interfaces)

Copie e utilize estas interfaces TypeScript diretamente na aplicação front-end:

```typescript
// ==================== USUÁRIOS & AUTENTICAÇÃO ====================

export interface UsuarioDTO {
  id: number;
  nome: string;
  dataNascimento: string | null; // Formato ISO "YYYY-MM-DD"
  email: string;
}

export interface DadosAutenticacao {
  email: string;
  senha: string;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioDTO;
}

// ==================== ARQUIVOS & MÍDIAS ====================

export interface ArquivoResponseDTO {
  id: number;
  nome: string;
  dataCriacao: string; // Formato ISO "YYYY-MM-DDTHH:mm:ss"
  url: string;         // URL pré-assinada do S3/MinIO (expira em ~10 minutos)
}

// ==================== ÁLBUNS ====================

export type ConviteStatus = 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'CANCELADO';

// Retornado nas listagens gerais de álbuns
export interface AlbumResumoDTO {
  id: number;
  nome: string;        // ATENÇÃO: nesta interface o campo se chama "nome"
  capaUrl: string | null; // URL para download da capa (/arquivos/download/{id})
}

// Retornado na consulta detalhada de um álbum específico
export interface AlbumDetalhadoDTO {
  id: number;
  name: string;        // ATENÇÃO: nesta interface o campo se chama "name"
  images: ArquivoResponseDTO[];
  capa: ArquivoResponseDTO | null;
  criador: UsuarioDTO;
  convidados: UsuarioDTO[];
}

// ==================== RESPOSTA DE ERRO PADRONIZADA ====================

export interface ErrorResponse {
  error: string;
}
```

---

## 4. Catálogo Detalhado de Endpoints

### 4.1 Módulo: Autenticação (`/auth`)

---

#### `POST /auth/cadastro`
Cadastra um novo usuário no sistema e dispara e-mail de boas-vindas assíncrono.
* **Acesso**: Público (sem autenticação)
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "nome": "João Silva",
    "email": "joao@email.com",
    "senha": "senhaSegura123"
  }
  ```
* **Respostas**:
  * `201 Created` - Sem corpo de resposta.
  * `500 Internal Server Error`:
    ```json
    { "error": "Email já cadastrado." }
    ```
    ou
    ```json
    { "error": "Nome indisponível." }
    ```

---

#### `POST /auth/login`
Autentica o usuário, retorna o token JWT e injeta o cookie HTTP-Only.
* **Acesso**: Público
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "email": "joao@email.com",
    "senha": "senhaSegura123"
  }
  ```
* **Respostas**:
  * `200 OK` + Header `Set-Cookie: gallery_token=...`:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "usuario": {
        "id": 1,
        "nome": "João Silva",
        "dataNascimento": null,
        "email": "joao@email.com"
      }
    }
    ```
  * `403 Forbidden`:
    ```json
    { "error": "Credenciais inválidas." }
    ```

---

#### `POST /auth/logout`
Encerra a sessão do usuário e deleta o cookie de autenticação do navegador.
* **Acesso**: Público / Autenticado
* **Headers**: Nenhum
* **Respostas**:
  * `200 OK` (com `Set-Cookie: gallery_token=; Max-Age=0`):
    ```
    "Logout realizado com sucesso."
    ```

---

### 4.2 Módulo: Arquivos (`/arquivos`)

---

#### `POST /arquivos/upload`
Realiza o upload de uma única imagem para a galeria do usuário.
* **Acesso**: Autenticado
* **Headers**: `Content-Type: multipart/form-data`
* **Form-Data**:
  * `file`: Arquivo binário (extensões aceitas: `.jpg`, `.jpeg`, `.png`, `.webp` | tamanho máx: 10MB)
* **Respostas**:
  * `201 Created`:
    ```json
    {
      "id": 15,
      "nome": "pordosol.jpg",
      "dataCriacao": "2026-09-10T14:35:10.123456",
      "url": "http://localhost:9000/online-gallery-bucket/...?X-Amz-Signature=..."
    }
    ```
  * `400 Bad Request`:
    ```json
    { "error": "Extensão da imagem não suportada. Os valores permitidos são .jpg, .png e .webp." }
    ```

---

#### `POST /arquivos/upload-batch`
Upload de múltiplas imagens simultaneamente.
* **Acesso**: Autenticado
* **Headers**: `Content-Type: multipart/form-data`
* **Form-Data**:
  * `files`: Lista de arquivos (`files` repetido para cada arquivo)
* **Respostas**:
  * `200 OK`: Array de `ArquivoResponseDTO`
    ```json
    [
      {
        "id": 16,
        "nome": "foto1.png",
        "dataCriacao": "2026-09-10T14:36:00",
        "url": "http://..."
      },
      {
        "id": 17,
        "nome": "foto2.png",
        "dataCriacao": "2026-09-10T14:36:01",
        "url": "http://..."
      }
    ]
    ```

---

#### `GET /arquivos`
Recupera todas as imagens enviadas pelo usuário logado.
* **Acesso**: Autenticado
* **Respostas**:
  * `200 OK`: Array de `ArquivoResponseDTO`

---

#### `GET /arquivos/download/{id}`
Download ou visualização direta via streaming do backend.
* **Acesso**: Autenticado
* **Path Variables**: `id` (ID da imagem)
* **Query Params**:
  * `isAttachment` (opcional, boolean, padrão: `false`): Se `false`, o header `Content-Disposition` será `inline` (ótimo para visualização direta); se `true`, será `attachment` (força o download no browser).
* **Respostas**:
  * `200 OK`: Stream binário do arquivo com o `Content-Type` correspondente (`image/jpeg`, `image/png`, etc.).
  * `404 Not Found`: `{ "error": "Arquivo não encontrado." }`

---

#### `GET /arquivos/download-batch`
Faz download de várias imagens selecionadas em um arquivo `.zip` único.
* **Acesso**: Autenticado
* **Query Params**: `ids` (Lista de IDs numéricos, ex: `?ids=1&ids=2&ids=3` ou `?ids=1,2,3`)
* **Respostas**:
  * `200 OK`: Arquivo binário `application/zip`, `Content-Disposition: attachment; filename="fotos_galeria.zip"`
  * `404 Not Found`: `{ "error": "Arquivo não encontrado." }` (se algum dos IDs não existir ou não pertencer ao usuário)

---

#### `GET /arquivos/public/download`
Acesso **público** para visualização da capa de um álbum a partir do token de convite.
* **Acesso**: Público (não exige login)
* **Query Params**:
  * `token` (obrigatório, string): UUID do convite enviado por e-mail.
* **Respostas**:
  * `200 OK`: Stream binário da imagem de capa (`inline`).
  * `403 Forbidden`:
    ```json
    { "error": "Convite expirado ou já utilizado." }
    ```
    ou
    ```json
    { "error": "Token inválido ou expirado." }
    ```

---

#### `DELETE /arquivos/delete/{id}`
Deleta permanentemente uma imagem do storage e do banco de dados.
* **Acesso**: Autenticado (somente o dono do arquivo)
* **Path Variables**: `id` (ID da imagem)
* **Respostas**:
  * `204 No Content` - Sem corpo de resposta.
  * `404 Not Found`: `{ "error": "Arquivo não encontrado." }`

---

#### `DELETE /arquivos/delete-batch`
Deleta múltiplas imagens de uma vez.
* **Acesso**: Autenticado
* **Query Params**: `ids` (Lista de IDs, ex: `?ids=1&ids=2`)
* **Respostas**:
  * `200 OK`: Array de IDs deletados: `[1, 2]`

---

### 4.3 Módulo: Álbuns (`/albuns`)

---

#### `POST /albuns/novo`
Cria um novo álbum a partir de fotos já enviadas pelo usuário. A primeira foto da lista é automaticamente definida como a capa inicial.
* **Acesso**: Autenticado
* **Query / Form Params**:
  * `nome` (string): Nome do álbum
  * `arquivoIds` (List<number>): Lista de IDs das imagens a associar (ex: `?arquivoIds=1&arquivoIds=2&nome=Viagem`)
* **Respostas**:
  * `201 Created`:
    ```json
    {
      "id": 5,
      "nome": "Viagem Salvador 2026",
      "capaUrl": "http://localhost:8080/arquivos/download/1"
    }
    ```
  * `404 Not Found`: `{ "error": "Arquivo não encontrado." }`

---

#### `GET /albuns`
Lista todos os álbuns **criados** pelo usuário autenticado.
* **Acesso**: Autenticado
* **Respostas**:
  * `200 OK`: Array de `AlbumResumoDTO`
    ```json
    [
      {
        "id": 5,
        "nome": "Viagem Salvador 2026",
        "capaUrl": "http://localhost:8080/arquivos/download/1"
      }
    ]
    ```

---

#### `GET /albuns/sharedWithMe`
Lista os álbuns compartilhados com o usuário autenticado (onde ele foi convidado).
* **Acesso**: Autenticado
* **Respostas**:
  * `200 OK`: Array de `AlbumResumoDTO`

---

#### `GET /albuns/{id}`
Recupera os detalhes completos de um álbum (fotos, capa, criador e lista de convidados). O usuário precisa ser o criador ou estar na lista de convidados.
* **Acesso**: Autenticado
* **Path Variables**: `id` (ID do álbum)
* **Respostas**:
  * `200 OK`: Objeto `AlbumDetalhadoDTO`:
    ```json
    {
      "id": 5,
      "name": "Viagem Salvador 2026",
      "images": [
        {
          "id": 1,
          "nome": "farol_da_barra.jpg",
          "dataCriacao": "2026-09-01T10:00:00",
          "url": "http://localhost:9000/online-gallery-bucket/..."
        }
      ],
      "capa": {
        "id": 1,
        "nome": "farol_da_barra.jpg",
        "dataCriacao": "2026-09-01T10:00:00",
        "url": "http://localhost:9000/online-gallery-bucket/..."
      },
      "criador": {
        "id": 2,
        "nome": "Carlos",
        "dataNascimento": "1995-05-12",
        "email": "carlos@email.com"
      },
      "convidados": [
        {
          "id": 8,
          "nome": "Ana",
          "dataNascimento": null,
          "email": "ana@email.com"
        }
      ]
    }
    ```
  * `404 Not Found`: `{ "error": "Album não encontrado." }`

---

#### `GET /albuns/download/{id}`
Faz o download de todas as imagens do álbum compactadas em um único arquivo `.zip`.
* **Acesso**: Autenticado (criador ou convidado)
* **Path Variables**: `id` (ID do álbum)
* **Respostas**:
  * `200 OK`: Arquivo `application/zip` (`Content-Disposition: attachment; filename="<NomeDoAlbum>"`).
  * `400 Bad Request`: Se o álbum não tiver fotos.
  * `404 Not Found`: Se o álbum não existir ou usuário não tiver acesso.

---

#### `PUT /albuns/add/{albumId}/imagem/{imagemId}`
Adiciona uma imagem que pertence ao usuário a um álbum acessível.
* **Acesso**: Autenticado
* **Path Variables**: `albumId` (ID do álbum), `imagemId` (ID da imagem)
* **Respostas**:
  * `201 Created` - Sem corpo.
  * `400 Bad Request`: `{ "error": "Essa imagem já existe nesse álbum." }`

---

#### `PUT /albuns/add-batch/{albumId}`
Adiciona múltiplas imagens ao álbum simultaneamente.
* **Acesso**: Autenticado
* **Path Variables**: `albumId`
* **Query Params**: `imageIds` (ex: `?imageIds=1&imageIds=2`)
* **Respostas**:
  * `201 Created` - Sem corpo.

---

#### `DELETE /albuns/delete/{id}`
Deleta um álbum permanentemente.
* **Acesso**: Autenticado (**Apenas o criador do álbum**)
* **Path Variables**: `id`
* **Respostas**:
  * `204 No Content`
  * `404 Not Found`: `{ "error": "Album não encontrado." }`

---

#### `DELETE /albuns/delete/{albumId}/imagem/{imagemId}`
Remove uma imagem específica de um álbum.
* **Acesso**: Autenticado
* **Regras de Permissão**: O usuário logado deve ser o **dono do álbum** OU o usuário que **adicionou** aquela imagem ao álbum.
* **Efeito Colateral**: Se o álbum ficar sem nenhuma foto restante e o usuário for o criador, o álbum é excluído automaticamente.
* **Respostas**:
  * `204 No Content`: Retorna o ID da imagem removida no corpo: `imagemId`.
  * `403 Forbidden`: `{ "error": "Você só pode remover fotos que você mesmo adicionou neste álbum." }`

---

#### `DELETE /albuns/delete-batch/{albumId}`
Remove um lote de imagens de um álbum.
* **Acesso**: Autenticado
* **Query Params**: `imageIds` (Lista de IDs numéricos)
* **Respostas**:
  * `204 No Content`: Retorna a lista de IDs removidos: `[1, 2]`.

---

#### `POST /albuns/invite/{id}`
Envia um convite de colaboração para outro usuário via e-mail (usando fila assíncrona RabbitMQ).
* **Acesso**: Autenticado (**Apenas o criador do álbum**)
* **Path Variables**: `id` (ID do álbum)
* **Query Params**: `email` (E-mail do usuário a convidar)
* **Respostas**:
  * `200 OK`
  * `409 Conflict`: `{ "error": "Você não pode se convidar para o próprio album" }`
  * `404 Not Found`: `{ "error": "Usuario não encontrado." }`

---

#### `POST /albuns/kick/{id}`
Remove um colaborador/convidado do álbum.
* **Acesso**: Autenticado (**Apenas o criador do álbum**)
* **Path Variables**: `id` (ID do álbum)
* **Query Params**: `email` (E-mail do usuário a remover)
* **Respostas**:
  * `200 OK`
  * `404 Not Found`: `{ "error": "Usuario não encontrado." }`

---

#### `POST /albuns/uninvite/{id}`
Cancela um convite que foi enviado anteriormente.
* **Acesso**: Autenticado (**Apenas o criador do álbum**)
* **Path Variables**: `id`
* **Query Params**: `email`
* **Respostas**:
  * `200 OK`

---

## 5. Fluxos Essenciais de Frontend e Exemplos Práticos

### 5.1 Configuração do Cliente HTTP (Exemplo Axios)

```typescript
// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true, // ESSENCIAL: envia e recebe o cookie gallery_token
});

// Fallback opcional com Bearer Token caso queira manter em memória/localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gallery_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor global para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && window.location.pathname !== '/login') {
      // Sessão expirada ou acesso negado
      console.warn('Sessão expirada ou acesso não autorizado');
    }
    return Promise.reject(error);
  }
);
```

---

### 5.2 Upload de Múltiplos Arquivos com Feedback de Progresso

```typescript
export async function uploadImagens(files: File[], onProgress?: (percent: number) => void) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post<ArquivoResponseDTO[]>('/arquivos/upload-batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
}
```

---

### 5.3 Exibição de Imagens e Expiração de URLs

As URLs no campo `url` de `ArquivoResponseDTO` são URLs pré-assinadas (*Presigned URLs*) com validade aproximada de **10 minutos**:
* **Uso direto no JSX**:
  ```tsx
  <img 
    src={arquivo.url} 
    alt={arquivo.nome} 
    loading="lazy" 
    onError={(e) => {
      // Se a URL expirar após longa inatividade, refaça o fetch da lista ou do álbum
      console.error('URL da imagem expirou ou erro ao carregar:', e);
    }} 
  />
  ```

---

### 5.4 Download de Álbum ou Arquivos em Lote (`.zip`)

Ao fazer download de binários, informe `responseType: 'blob'`:

```typescript
export async function baixarAlbumZip(albumId: number, nomeAlbum: string) {
  const response = await api.get(`/albuns/download/${albumId}`, {
    responseType: 'blob',
  });

  // Dispara o download no navegador
  const blob = new Blob([response.data], { type: 'application/zip' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `${nomeAlbum}.zip`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
```

---

### 5.5 Tratamento da Tela de Convite (`/albuns/convite?token=<uuid>`)

Quando o convidado acessa o link enviado por e-mail:
1. Obtenha o parâmetro `token` da URL:
   ```typescript
   const params = new URLSearchParams(window.location.search);
   const token = params.get('token');
   ```
2. Para exibir a capa do álbum de forma pública (sem exigir login antecipado):
   ```tsx
   <img 
     src={`${api.defaults.baseURL}/arquivos/public/download?token=${token}`} 
     alt="Capa do Álbum Convidado" 
   />
   ```
3. Se o usuário já estiver logado, redirecione-o para a visualização dos álbuns compartilhados (`/albuns/sharedWithMe`).

---

## 6. Sumário de Respostas de Erro

A API utiliza o seguinte formato padronizado de erro para exceções de negócio:

```json
{
  "error": "Descrição legível do erro ocorrido"
}
```

### Tabela de Erros Comuns:

| Código HTTP | Causa / Mensagem | Ação Recomendada no Front-end |
| :--- | :--- | :--- |
| `400 Bad Request` | `"Extensão da imagem não suportada..."` | Validar extensão no input (`accept="image/png,image/jpeg,image/webp"`). |
| `400 Bad Request` | `"Essa imagem já existe nesse álbum."` | Notificar o usuário com Toast/Alerta de duplicidade. |
| `403 Forbidden` | `"Credenciais inválidas."` ou `"Usuário não encontrado."` | Exibir mensagem de erro no formulário de login. |
| `403 Forbidden` | `"Você só pode remover fotos que você mesmo adicionou neste álbum."` | Ocultar botão de exclusão de fotos que não pertencem ao usuário logado em álbuns compartilhados. |
| `403 Forbidden` | `"Convite expirado ou já utilizado."` | Indicar que o link do convite perdeu a validade (validade máx: 7 dias). |
| `404 Not Found` | `"Album não encontrado."` ou `"Arquivo não encontrado."` | Redirecionar para listagem ou exibir mensagem de recurso inexistente. |
| `409 Conflict` | `"Você não pode se convidar para o próprio album"` | Impedir digitação do próprio e-mail no modal de convite. |
| `500 Internal Server Error` | `"Erro de processamento ao tentar manipular o arquivo."` | Falha na comunicação com o MinIO/S3. Solicitar nova tentativa. |
