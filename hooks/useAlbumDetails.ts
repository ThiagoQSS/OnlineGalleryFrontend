"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlbumDetalhadoDTO } from "@/types/api";
import { albumService } from "@/services/albumService";
import { PhotoMeta } from "@/hooks/usePhotos";

export function useAlbumDetails(albumId: number) {
	const router = useRouter();
	const [album, setAlbum] = useState<AlbumDetalhadoDTO | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
	const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
	const [metaMap, setMetaMap] = useState<Record<number, PhotoMeta>>({});

	// Carrega dados do álbum
	const fetchAlbum = useCallback(async () => {
		if (isNaN(albumId)) return;
		setLoading(true);
		setError(null);
		try {
			const data = await albumService.getAlbumDetails(albumId);
			setAlbum(data);
		} catch (err: unknown) {
			console.error("Erro ao buscar detalhes do álbum:", err);
			const errorObj = err as { response?: { data?: { error?: string } } };
			setError(errorObj.response?.data?.error || "Álbum não encontrado ou sem permissão de acesso.");
		} finally {
			setLoading(false);
		}
	}, [albumId]);

	useEffect(() => {
		if (isNaN(albumId)) return;
		let isMounted = true;
		albumService
			.getAlbumDetails(albumId)
			.then((data) => {
				if (isMounted) {
					setAlbum(data);
					setLoading(false);
				}
			})
			.catch((err) => {
				if (isMounted) {
					console.error("Erro ao buscar detalhes do álbum:", err);
					const errorObj = err as { response?: { data?: { error?: string } } };
					setError(errorObj.response?.data?.error || "Álbum não encontrado ou sem permissão de acesso.");
					setLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [albumId]);

	// Atualiza dimensões das fotos do álbum
	const updatePhotoDimensions = useCallback((id: number, width: number, height: number) => {
		const safeWidth = width > 0 ? width : 1200;
		const safeHeight = height > 0 ? height : 800;
		const ratio = safeWidth / safeHeight;

		let orientation: "panorama" | "landscape" | "square" | "portrait" = "landscape";
		if (ratio >= 1.75) orientation = "panorama";
		else if (ratio >= 1.15) orientation = "landscape";
		else if (ratio >= 0.85) orientation = "square";
		else orientation = "portrait";

		setMetaMap((prev) => ({
			...prev,
			[id]: {
				width: safeWidth,
				height: safeHeight,
				ratio,
				orientation,
				isLoaded: true,
				hasError: false,
			},
		}));
	}, []);

	// Preload dimensions
	useEffect(() => {
		if (!album?.images || typeof window === "undefined") return;

		album.images.forEach((photo) => {
			if (metaMap[photo.id] || !photo.url) return;

			const img = new window.Image();
			img.src = photo.url;
			img.onload = () => {
				updatePhotoDimensions(photo.id, img.naturalWidth, img.naturalHeight);
			};
		});
	}, [album?.images, metaMap, updatePhotoDimensions]);

	// Seleção de fotos dentro do álbum
	const toggleSelectPhoto = useCallback((id: number) => {
		setSelectedPhotoIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const selectAllPhotos = useCallback(() => {
		if (!album?.images) return;
		setSelectedPhotoIds(new Set(album.images.map((p) => p.id)));
	}, [album]);

	const clearPhotoSelection = useCallback(() => {
		setSelectedPhotoIds(new Set());
	}, []);

	// Adicionar fotos em lote ao álbum
	const addPhotosBatch = useCallback(
		async (imageIds: number[]) => {
			if (imageIds.length === 0) return;
			try {
				await albumService.addPhotosBatchToAlbum(albumId, imageIds);
				await fetchAlbum();
			} catch (err) {
				console.error("Erro ao adicionar fotos ao álbum:", err);
				throw err;
			}
		},
		[albumId, fetchAlbum],
	);

	// Remover uma foto do álbum
	const removePhotoFromAlbum = useCallback(
		async (imageId: number) => {
			try {
				await albumService.removePhotoFromAlbum(albumId, imageId);
				setAlbum((prev) => {
					if (!prev) return prev;
					const updated = prev.images.filter((img) => img.id !== imageId);
					return { ...prev, images: updated };
				});
				setSelectedPhotoIds((prev) => {
					const next = new Set(prev);
					next.delete(imageId);
					return next;
				});
			} catch (err) {
				console.error("Erro ao remover foto do álbum:", err);
				throw err;
			}
		},
		[albumId],
	);

	// Remover fotos selecionadas em lote do álbum
	const removeSelectedPhotosFromAlbum = useCallback(async () => {
		if (selectedPhotoIds.size === 0) return;
		const idsArray = Array.from(selectedPhotoIds);
		try {
			await albumService.removePhotosBatchFromAlbum(albumId, idsArray);
			setAlbum((prev) => {
				if (!prev) return prev;
				const updated = prev.images.filter((img) => !selectedPhotoIds.has(img.id));
				return { ...prev, images: updated };
			});
			clearPhotoSelection();
		} catch (err) {
			console.error("Erro ao remover fotos em lote do álbum:", err);
			throw err;
		}
	}, [albumId, selectedPhotoIds, clearPhotoSelection]);

	// Deletar o álbum
	const deleteAlbum = useCallback(async () => {
		try {
			await albumService.deleteAlbum(albumId);
			router.push("/albums");
		} catch (err) {
			console.error("Erro ao excluir álbum:", err);
			throw err;
		}
	}, [albumId, router]);

	// Baixar zip do álbum
	const downloadAlbum = useCallback(async () => {
		if (!album) return;
		try {
			await albumService.downloadAlbumZip(album.id, album.name);
		} catch (err) {
			console.error("Erro ao baixar álbum:", err);
			throw err;
		}
	}, [album]);

	// Convidar colaborador
	const inviteCollaborator = useCallback(
		async (email: string) => {
			try {
				await albumService.inviteCollaborator(albumId, email);
				await fetchAlbum();
			} catch (err) {
				console.error("Erro ao convidar colaborador:", err);
				throw err;
			}
		},
		[albumId, fetchAlbum],
	);

	// Remover colaborador
	const kickCollaborator = useCallback(
		async (email: string) => {
			try {
				await albumService.kickCollaborator(albumId, email);
				await fetchAlbum();
			} catch (err) {
				console.error("Erro ao remover colaborador:", err);
				throw err;
			}
		},
		[albumId, fetchAlbum],
	);

	return {
		album,
		loading,
		error,
		selectedPhotoIndex,
		setSelectedPhotoIndex,
		selectedPhotoIds,
		metaMap,
		toggleSelectPhoto,
		selectAllPhotos,
		clearPhotoSelection,
		updatePhotoDimensions,
		fetchAlbum,
		addPhotosBatch,
		removePhotoFromAlbum,
		removeSelectedPhotosFromAlbum,
		deleteAlbum,
		downloadAlbum,
		inviteCollaborator,
		kickCollaborator,
	};
}
