import { ArquivoResponseDTO } from "./api";

export type Photo = ArquivoResponseDTO & {
	dataCriacao: string | Date;
};
