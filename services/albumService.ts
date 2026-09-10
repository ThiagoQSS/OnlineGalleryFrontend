import { api } from "./api";
import { AlbumDetalhadoDTO, AlbumResumoDTO } from "@/types/api";
import { triggerBlobDownload } from "./photoService";

export const albumService = {
	async getMyAlbums(): Promise<AlbumResumoDTO[]> {
		const response = await api.get<AlbumResumoDTO[]>("/albuns");
		return response.data;
	},

	async getSharedAlbums(): Promise<AlbumResumoDTO[]> {
		const response = await api.get<AlbumResumoDTO[]>("/albuns/sharedWithMe");
		return response.data;
	},

	async getAlbumDetails(id: number): Promise<AlbumDetalhadoDTO> {
		const response = await api.get<AlbumDetalhadoDTO>(`/albuns/${id}`);
		return response.data;
	},

	async createAlbum(nome: string, arquivoIds: number[]): Promise<AlbumResumoDTO> {
		const params = new URLSearchParams();
		params.append("nome", nome);
		arquivoIds.forEach((id) => params.append("arquivoIds", id.toString()));

		const response = await api.post<AlbumResumoDTO>("/albuns/novo", null, {
			params,
		});
		return response.data;
	},

	async downloadAlbumZip(id: number, nomeAlbum = "album"): Promise<void> {
		const response = await api.get(`/albuns/download/${id}`, {
			responseType: "blob",
		});
		triggerBlobDownload(response.data, `${nomeAlbum}.zip`);
	},

	async addPhotoToAlbum(albumId: number, imagemId: number): Promise<void> {
		await api.put(`/albuns/add/${albumId}/imagem/${imagemId}`);
	},

	async addPhotosBatchToAlbum(albumId: number, imageIds: number[]): Promise<void> {
		const params = new URLSearchParams();
		imageIds.forEach((id) => params.append("imageIds", id.toString()));

		await api.put(`/albuns/add-batch/${albumId}`, null, {
			params,
		});
	},

	async removePhotoFromAlbum(albumId: number, imagemId: number): Promise<void> {
		await api.delete(`/albuns/delete/${albumId}/imagem/${imagemId}`);
	},

	async removePhotosBatchFromAlbum(albumId: number, imageIds: number[]): Promise<number[]> {
		const params = new URLSearchParams();
		imageIds.forEach((id) => params.append("imageIds", id.toString()));

		const response = await api.delete<number[]>(`/albuns/delete-batch/${albumId}`, {
			params,
		});
		return response.data;
	},

	async deleteAlbum(id: number): Promise<void> {
		await api.delete(`/albuns/delete/${id}`);
	},

	async inviteCollaborator(albumId: number, email: string): Promise<void> {
		await api.post(`/albuns/invite/${albumId}`, null, {
			params: { email },
		});
	},

	async kickCollaborator(albumId: number, email: string): Promise<void> {
		await api.post(`/albuns/kick/${albumId}`, null, {
			params: { email },
		});
	},

	async uninviteCollaborator(albumId: number, email: string): Promise<void> {
		await api.post(`/albuns/uninvite/${albumId}`, null, {
			params: { email },
		});
	},
};
