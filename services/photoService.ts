import { api } from "./api";
import { ArquivoResponseDTO } from "@/types/api";

export function triggerBlobDownload(blob: Blob, filename: string) {
	const downloadUrl = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = downloadUrl;
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(downloadUrl);
}

export const photoService = {
	async getPhotos(): Promise<ArquivoResponseDTO[]> {
		const response = await api.get<ArquivoResponseDTO[]>("/arquivos");
		return response.data;
	},

	async uploadPhoto(file: File): Promise<ArquivoResponseDTO> {
		const formData = new FormData();
		formData.append("file", file);

		const response = await api.post<ArquivoResponseDTO>("/arquivos/upload", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	},

	async uploadPhotosBatch(
		files: File[],
		onProgress?: (percent: number) => void,
	): Promise<ArquivoResponseDTO[]> {
		const formData = new FormData();
		files.forEach((file) => {
			formData.append("files", file);
		});

		const response = await api.post<ArquivoResponseDTO[]>("/arquivos/upload-batch", formData, {
			headers: { "Content-Type": "multipart/form-data" },
			onUploadProgress: (progressEvent) => {
				if (progressEvent.total && onProgress) {
					const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					onProgress(percent);
				}
			},
		});
		return response.data;
	},

	async downloadPhoto(id: number, filename = "foto.jpg") {
		const response = await api.get(`/arquivos/download/${id}`, {
			params: { isAttachment: true },
			responseType: "blob",
		});
		triggerBlobDownload(response.data, filename);
	},

	async downloadPhotosBatch(ids: number[], filename = "fotos_galeria.zip") {
		const params = new URLSearchParams();
		ids.forEach((id) => params.append("ids", id.toString()));

		const response = await api.get("/arquivos/download-batch", {
			params,
			responseType: "blob",
		});
		triggerBlobDownload(response.data, filename);
	},

	async deletePhoto(id: number): Promise<void> {
		await api.delete(`/arquivos/delete/${id}`);
	},

	async deletePhotosBatch(ids: number[]): Promise<number[]> {
		const params = new URLSearchParams();
		ids.forEach((id) => params.append("ids", id.toString()));

		const response = await api.delete<number[]>("/arquivos/delete-batch", {
			params,
		});
		return response.data;
	},
};
