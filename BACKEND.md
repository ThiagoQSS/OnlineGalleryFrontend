# Frontend Integration Guide with the API (File Management Microservice)

This document serves as a detailed technical specification for the development and integration of the **Front-end** with the **File and Album Management** microservice (`file-management-ms`) of the **OnlineGallery** platform.

---

## 1. Architecture Overview

The microservice acts as the main entry point (BFF - Backend for Frontend) for managing media, albums, and user control of the gallery.

```
┌─────────────────┐       HTTP / REST (JWT / Cookie)      ┌─────────────────────────────┐
│                 ├──────────────────────────────────────►│     file-management-ms      │
│  Front-end App  │◄──────────────────────────────────────┤  (Spring Boot / Java 21)    │
│  (React/Vue/etc)│       Direct Presigned URL (GET)      └────────┬───────────────┬────┘
│                 ├───────────────────────────────────┐            │               │
└─────────────────┘                                   ▼            ▼               ▼
                                                ┌───────────┐┌───────────┐ ┌───────────────┐
                                                │  MinIO /  ││ PostgreSQL│ │   RabbitMQ    │
                                                │  AWS S3   ││  Database │ │ (E-mail       │
                                                └───────────┘└───────────┘ │  sending ms)  │
                                                                           └───────────────┘
```

### Key Integration Principles:
1. **Image Consumption via Presigned URLs**: The API responses provide presigned URLs generated via the AWS SDK (pointing to MinIO in development or S3 in production). The front-end can use these URLs directly in `<img>` tags or download links without needing to send authentication headers.
2. **Asynchronous E-mail Delegation**: Actions such as user registration and album invitations trigger events via RabbitMQ asynchronously. The front-end does not need to orchestrate e-mail sending or wait for SMTP server responses.
3. **Direct or Compressed Download**: The backend has dedicated endpoints for individual download or batch compression (`.zip`) of images and entire albums.
4. **Invitation Page**: The invitation e-mail directs the guest to `${FRONTEND_URL}/albuns/convite?token=<uuid>`. The front-end must capture this token in the query param to render the information and the public album cover.

---

## 2. Authentication and Security

The API adopts **Stateless authentication based on JWT**, offering support for two ways of sending the token (the front-end can use whichever is more convenient, or both):

### Mode 1: HttpOnly Cookie (Recommended for Browsers)
* Upon successful login (`POST /auth/login`), the API returns the `Set-Cookie` header:
  ```http
  Set-Cookie: gallery_token=<token_jwt>; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax
  ```
* **Front-end Requirement**: All requests (via Axios or Fetch) must enable sending cross-origin credentials:
  * **Axios**: `axios.defaults.withCredentials = true;`
  * **Fetch**: `fetch(url, { credentials: 'include', ... })`
* Upon logout (`POST /auth/logout`), the cookie is automatically invalidated (`Max-Age=0`).

### Mode 2: Authorization Bearer Header
* The response body of `POST /auth/login` also includes the `token` field (String).
* The front-end can store this token and pass it manually in the HTTP headers:
  ```http
  Authorization: Bearer <seu_token_jwt>
  ```

### CORS Policy and Environment Variables
* In development, ensure you configure the API base URL:
  * Recommended environment variable in the front-end: `VITE_API_BASE_URL` or `NEXT_PUBLIC_API_BASE_URL`.
  * Example: `http://localhost:8080` (or the port allocated by Eureka / Gateway).

---

## 3. Types and Models (TypeScript Interfaces)

Copy and use these TypeScript interfaces directly in the front-end application:

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

## 4. Detailed Endpoint Catalog

### 4.1 Module: Authentication (`/auth`)

---

#### `POST /auth/cadastro`
Registers a new user in the system and triggers an asynchronous welcome e-mail.
* **Access**: Public (without authentication)
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "nome": "João Silva",
    "email": "joao@email.com",
    "senha": "senhaSegura123"
  }
  ```
* **Responses**:
  * `201 Created` - No response body.
  * `500 Internal Server Error`:
    ```json
    { "error": "Email já cadastrado." }
    ```
    or
    ```json
    { "error": "Nome indisponível." }
    ```

---

#### `POST /auth/login`
Authenticates the user, returns the JWT token, and injects the HTTP-Only cookie.
* **Access**: Public
* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "email": "joao@email.com",
    "senha": "senhaSegura123"
  }
  ```
* **Responses**:
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
Ends the user session and deletes the authentication cookie from the browser.
* **Access**: Public / Authenticated
* **Headers**: None
* **Responses**:
  * `200 OK` (with `Set-Cookie: gallery_token=; Max-Age=0`):
    ```
    "Logout realizado com sucesso."
    ```

---

### 4.2 Module: Files (`/arquivos`)

---

#### `POST /arquivos/upload`
Uploads a single image to the user's gallery.
* **Access**: Authenticated
* **Headers**: `Content-Type: multipart/form-data`
* **Form-Data**:
  * `file`: Binary file (accepted extensions: `.jpg`, `.jpeg`, `.png`, `.webp` | max size: 10MB)
* **Responses**:
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
Uploads multiple images simultaneously.
* **Access**: Authenticated
* **Headers**: `Content-Type: multipart/form-data`
* **Form-Data**:
  * `files`: List of files (`files` repeated for each file)
* **Responses**:
  * `200 OK`: Array of `ArquivoResponseDTO`
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
Retrieves all images uploaded by the logged-in user.
* **Access**: Authenticated
* **Responses**:
  * `200 OK`: Array of `ArquivoResponseDTO`

---

#### `GET /arquivos/download/{id}`
Download or direct viewing via streaming from the backend.
* **Access**: Authenticated
* **Path Variables**: `id` (Image ID)
* **Query Params**:
  * `isAttachment` (optional, boolean, default: `false`): If `false`, the `Content-Disposition` header will be `inline` (great for direct viewing); if `true`, it will be `attachment` (forces download in the browser).
* **Responses**:
  * `200 OK`: Binary stream of the file with the corresponding `Content-Type` (`image/jpeg`, `image/png`, etc.).
  * `404 Not Found`: `{ "error": "Arquivo não encontrado." }`

---

#### `GET /arquivos/download-batch`
Downloads multiple selected images in a single `.zip` file.
* **Access**: Authenticated
* **Query Params**: `ids` (List of numeric IDs, ex: `?ids=1&ids=2&ids=3` or `?ids=1,2,3`)
* **Responses**:
  * `200 OK`: Binary file `application/zip`, `Content-Disposition: attachment; filename="fotos_galeria.zip"`
  * `404 Not Found`: `{ "error": "Arquivo não encontrado." }` (if any of the IDs do not exist or do not belong to the user)

---

#### `GET /arquivos/public/download`
**Public** access for viewing an album cover using the invitation token.
* **Access**: Public (does not require login)
* **Query Params**:
  * `token` (required, string): UUID of the invitation sent via e-mail.
* **Responses**:
  * `200 OK`: Binary stream of the cover image (`inline`).
  * `403 Forbidden`:
    ```json
    { "error": "Convite expirado ou já utilizado." }
    ```
    or
    ```json
    { "error": "Token inválido ou expirado." }
    ```

---

#### `DELETE /arquivos/delete/{id}`
Permanently deletes an image from storage and the database.
* **Access**: Authenticated (only the file owner)
* **Path Variables**: `id` (Image ID)
* **Responses**:
  * `204 No Content` - No response body.
  * `404 Not Found`: `{ "error": "Arquivo não encontrado." }`

---

#### `DELETE /arquivos/delete-batch`
Deletes multiple images at once.
* **Access**: Authenticated
* **Query Params**: `ids` (List of IDs, ex: `?ids=1&ids=2`)
* **Responses**:
  * `200 OK`: Array of deleted IDs: `[1, 2]`

---

### 4.3 Module: Albums (`/albuns`)

---

#### `POST /albuns/novo`
Creates a new album from photos already uploaded by the user. The first photo in the list is automatically set as the initial cover.
* **Access**: Authenticated
* **Query / Form Params**:
  * `nome` (string): Album name
  * `arquivoIds` (List<number>): List of image IDs to associate (ex: `?arquivoIds=1&arquivoIds=2&nome=Viagem`)
* **Responses**:
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
Lists all albums **created** by the authenticated user.
* **Access**: Authenticated
* **Responses**:
  * `200 OK`: Array of `AlbumResumoDTO`
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
Lists the albums shared with the authenticated user (where they were invited).
* **Access**: Authenticated
* **Responses**:
  * `200 OK`: Array of `AlbumResumoDTO`

---

#### `GET /albuns/{id}`
Retrieves the complete details of an album (photos, cover, creator, and guest list). The user must be the creator or be on the guest list.
* **Access**: Authenticated
* **Path Variables**: `id` (Album ID)
* **Responses**:
  * `200 OK`: `AlbumDetalhadoDTO` object:
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
Downloads all images from the album compressed into a single `.zip` file.
* **Access**: Authenticated (creator or guest)
* **Path Variables**: `id` (Album ID)
* **Responses**:
  * `200 OK`: `application/zip` file (`Content-Disposition: attachment; filename="<NomeDoAlbum>"`).
  * `400 Bad Request`: If the album has no photos.
  * `404 Not Found`: If the album does not exist or the user has no access.

---

#### `PUT /albuns/add/{albumId}/imagem/{imagemId}`
Adds an image belonging to the user to an accessible album.
* **Access**: Authenticated
* **Path Variables**: `albumId` (Album ID), `imagemId` (Image ID)
* **Responses**:
  * `201 Created` - No body.
  * `400 Bad Request`: `{ "error": "Essa imagem já existe nesse álbum." }`

---

#### `PUT /albuns/add-batch/{albumId}`
Adds multiple images to the album simultaneously.
* **Access**: Authenticated
* **Path Variables**: `albumId`
* **Query Params**: `imageIds` (ex: `?imageIds=1&imageIds=2`)
* **Responses**:
  * `201 Created` - No body.

---

#### `DELETE /albuns/delete/{id}`
Permanently deletes an album.
* **Access**: Authenticated (**Only the album creator**)
* **Path Variables**: `id`
* **Responses**:
  * `204 No Content`
  * `404 Not Found`: `{ "error": "Album não encontrado." }`

---

#### `DELETE /albuns/delete/{albumId}/imagem/{imagemId}`
Removes a specific image from an album.
* **Access**: Authenticated
* **Permission Rules**: The logged-in user must be the **album owner** OR the user who **added** that image to the album.
* **Side Effect**: If the album is left with no photos remaining and the user is the creator, the album is automatically deleted.
* **Responses**:
  * `204 No Content`: Returns the removed image ID in the body: `imagemId`.
  * `403 Forbidden`: `{ "error": "Você só pode remover fotos que você mesmo adicionou neste álbum." }`

---

#### `DELETE /albuns/delete-batch/{albumId}`
Removes a batch of images from an album.
* **Access**: Authenticated
* **Query Params**: `imageIds` (List of numeric IDs)
* **Responses**:
  * `204 No Content`: Returns the list of removed IDs: `[1, 2]`.

---

#### `POST /albuns/invite/{id}`
Sends a collaboration invitation to another user via e-mail (using asynchronous RabbitMQ queue).
* **Access**: Authenticated (**Only the album creator**)
* **Path Variables**: `id` (Album ID)
* **Query Params**: `email` (E-mail of the user to invite)
* **Responses**:
  * `200 OK`
  * `409 Conflict`: `{ "error": "Você não pode se convidar para o próprio album" }`
  * `404 Not Found`: `{ "error": "Usuario não encontrado." }`

---

#### `POST /albuns/kick/{id}`
Removes a collaborator/guest from the album.
* **Access**: Authenticated (**Only the album creator**)
* **Path Variables**: `id` (Album ID)
* **Query Params**: `email` (E-mail of the user to remove)
* **Responses**:
  * `200 OK`
  * `404 Not Found`: `{ "error": "Usuario não encontrado." }`

---

#### `POST /albuns/uninvite/{id}`
Cancels an invitation that was previously sent.
* **Access**: Authenticated (**Only the album creator**)
* **Path Variables**: `id`
* **Query Params**: `email`
* **Responses**:
  * `200 OK`

---

## 5. Essential Frontend Flows and Practical Examples

### 5.1 HTTP Client Configuration (Axios Example)

```typescript
// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true, // ESSENTIAL: sends and receives the gallery_token cookie
});

// Optional fallback with Bearer Token in case you want to keep it in memory/localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gallery_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && window.location.pathname !== '/login') {
      // Session expired or access denied
      console.warn('Sessão expirada ou acesso não autorizado');
    }
    return Promise.reject(error);
  }
);
```

---

### 5.2 Multiple File Upload with Progress Feedback

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

### 5.3 Displaying Images and URL Expiration

The URLs in the `url` field of `ArquivoResponseDTO` are *Presigned URLs* valid for approximately **10 minutes**:
* **Direct use in JSX**:
  ```tsx
  <img 
    src={arquivo.url} 
    alt={arquivo.nome} 
    loading="lazy" 
    onError={(e) => {
      // If the URL expires after long inactivity, refetch the list or the album
      console.error('URL da imagem expirou ou erro ao carregar:', e);
    }} 
  />
  ```

---

### 5.4 Download Album or Files in Batch (`.zip`)

When downloading binaries, specify `responseType: 'blob'`:

```typescript
export async function baixarAlbumZip(albumId: number, nomeAlbum: string) {
  const response = await api.get(`/albuns/download/${albumId}`, {
    responseType: 'blob',
  });

  // Triggers the download in the browser
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

### 5.5 Handling the Invitation Screen (`/albuns/convite?token=<uuid>`)

When the guest accesses the link sent via e-mail:
1. Get the `token` parameter from the URL:
   ```typescript
   const params = new URLSearchParams(window.location.search);
   const token = params.get('token');
   ```
2. To display the public album cover (without requiring advance login):
   ```tsx
   <img 
     src={`${api.defaults.baseURL}/arquivos/public/download?token=${token}`} 
     alt="Capa do Álbum Convidado" 
   />
   ```
3. If the user is already logged in, redirect them to view the shared albums (`/albuns/sharedWithMe`).

---

## 6. Summary of Error Responses

The API uses the following standardized error format for business exceptions:

```json
{
  "error": "Descrição legível do erro ocorrido"
}
```

### Table of Common Errors:

| HTTP Code | Cause / Message | Recommended Action on Front-end |
| :--- | :--- | :--- |
| `400 Bad Request` | `"Extensão da imagem não suportada..."` | Validate extension on input (`accept="image/png,image/jpeg,image/webp"`). |
| `400 Bad Request` | `"Essa imagem já existe nesse álbum."` | Notify the user with Duplicate Toast/Alert. |
| `403 Forbidden` | `"Credenciais inválidas."` or `"Usuário não encontrado."` | Display error message on the login form. |
| `403 Forbidden` | `"Você só pode remover fotos que você mesmo adicionou neste álbum."` | Hide delete button for photos that do not belong to the logged-in user in shared albums. |
| `403 Forbidden` | `"Convite expirado ou já utilizado."` | Indicate that the invitation link is no longer valid (max validity: 7 days). |
| `404 Not Found` | `"Album não encontrado."` or `"Arquivo não encontrado."` | Redirect to listing or display missing resource message. |
| `409 Conflict` | `"Você não pode se convidar para o próprio album"` | Prevent typing own e-mail in the invitation modal. |
| `500 Internal Server Error` | `"Erro de processamento ao tentar manipular o arquivo."` | Failure to communicate with MinIO/S3. Request a retry. |
