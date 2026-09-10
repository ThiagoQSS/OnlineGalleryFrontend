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
	url: string; // URL pré-assinada do S3/MinIO (expira em ~10 minutos)
}

// ==================== ÁLBUNS ====================

export type ConviteStatus = "PENDENTE" | "ACEITO" | "RECUSADO" | "CANCELADO";

// Retornado nas listagens gerais de álbuns
export interface AlbumResumoDTO {
	id: number;
	nome: string; // Campo "nome" na listagem
	capaUrl: string | null; // URL para download da capa (/arquivos/download/{id})
}

// Retornado na consulta detalhada de um álbum específico
export interface AlbumDetalhadoDTO {
	id: number;
	name: string; // Backend retorna "name" no detalhado
	images: ArquivoResponseDTO[];
	capa: ArquivoResponseDTO | null;
	criador: UsuarioDTO;
	convidados: UsuarioDTO[];
}

// ==================== RESPOSTA DE ERRO PADRONIZADA ====================

export interface ErrorResponse {
	error: string;
}
