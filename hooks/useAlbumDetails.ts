"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlbumDetalhadoDTO, AlbumResumoDTO } from "@/types/api";
import { albumService } from "@/services/albumService";
import { PhotoMeta } from "@/hooks/usePhotos";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

export function useAlbumDetails(albumId: number) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const {
		data: album = null,
		isLoading: loading,
		error: queryError,
		refetch,
	} = useQuery<AlbumDetalhadoDTO | null>({
		queryKey: ["albumDetails", albumId],
		queryFn: async () => {
			if (isNaN(albumId)) return null;
			return await albumService.getAlbumDetails(albumId);
		},
		enabled: !isNaN(albumId),
		staleTime: 8 * 60 * 1000,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	const fetchAlbum = useCallback(async () => {
		await refetch();
	}, [refetch]);

	const error = queryError
		? (queryError as any).response?.data?.error ||
		  "Álbum não encontrado ou sem permissão de acesso."
		: null;

	const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
		null,
	);
	const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(
		new Set(),
	);
	const [metaMap, setMetaMap] = useState<Record<number, PhotoMeta>>({});

	// Atualiza dimensões das fotos do álbum
	const updatePhotoDimensions = useCallback(
		(id: number, width: number, height: number) => {
			const safeWidth = width > 0 ? width : 1200;
			const safeHeight = height > 0 ? height : 800;
			const ratio = safeWidth / safeHeight;

			let orientation: "panorama" | "landscape" | "square" | "portrait" =
				"landscape";
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
		},
		[],
	);

	// Preload dimensions
	useEffect(() => {
		if (!album?.images || typeof window === "undefined") return;

		album.images.forEach((photo) => {
			if (metaMap[photo.id] || !photo.url) return;

			const img = new window.Image();
			img.src = photo.url;
			img.onload = () => {
				updatePhotoDimensions(
					photo.id,
					img.naturalWidth,
					img.naturalHeight,
				);
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
				queryClient.setQueryData<AlbumDetalhadoDTO | null>(
					["albumDetails", albumId],
					(prev) => {
						if (!prev) return prev;
						return {
							...prev,
							images: prev.images.filter((img) => img.id !== imageId),
						};
					},
				);
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
		[albumId, queryClient],
	);

	// Remover fotos selecionadas em lote do álbum
	const removeSelectedPhotosFromAlbum = useCallback(async () => {
		if (selectedPhotoIds.size === 0) return;
		const idsArray = Array.from(selectedPhotoIds);
		try {
			await albumService.removePhotosBatchFromAlbum(albumId, idsArray);
			queryClient.setQueryData<AlbumDetalhadoDTO | null>(
				["albumDetails", albumId],
				(prev) => {
					if (!prev) return prev;
					return {
						...prev,
						images: prev.images.filter((img) => !selectedPhotoIds.has(img.id)),
					};
				},
			);
			clearPhotoSelection();
		} catch (err) {
			console.error("Erro ao remover fotos em lote do álbum:", err);
			throw err;
		}
	}, [albumId, selectedPhotoIds, clearPhotoSelection, queryClient]);

	const deleteAlbumMutation = useMutation({
		mutationFn: async () => {
			await albumService.deleteAlbum(albumId);
		},
		onSuccess: () => {
			queryClient.setQueryData<AlbumResumoDTO[]>(
				["albums", "my"],
				(prev = []) => prev.filter((a) => a.id !== albumId),
			);
			queryClient.setQueryData<AlbumResumoDTO[]>(
				["albums", "shared"],
				(prev = []) => prev.filter((a) => a.id !== albumId),
			);
			router.push("/albuns");
		},
		onError: (err) => {
			console.error("Erro ao excluir álbum:", err);
		},
	});

	// Deletar o álbum
	const deleteAlbum = useCallback(async () => {
		await deleteAlbumMutation.mutateAsync();
	}, [deleteAlbumMutation]);

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
				queryClient.setQueryData<AlbumDetalhadoDTO | null>(
					["albumDetails", albumId],
					(prev) => {
						if (!prev) return prev;
						// Optimistic UI update or wait for refetch? We do an optimistic update here
						const novoConvidado = {
							id: Date.now(),
							email,
							nome: email.split("@")[0],
							dataNascimento: null,
						};
						return {
							...prev,
							convidados: [...prev.convidados, novoConvidado],
						};
					},
				);
			} catch (err) {
				console.log("Erro ao convidar colaborador:", err);
				throw err;
			}
		},
		[albumId, queryClient],
	);

	// Remover colaborador
	const kickCollaborator = useCallback(
		async (email: string) => {
			try {
				await albumService.kickCollaborator(albumId, email);
				queryClient.setQueryData<AlbumDetalhadoDTO | null>(
					["albumDetails", albumId],
					(prev) => {
						if (!prev) return prev;
						return {
							...prev,
							convidados: prev.convidados.filter((c) => c.email !== email),
						};
					},
				);
			} catch (err) {
				console.error("Erro ao remover colaborador:", err);
				throw err;
			}
		},
		[albumId, queryClient],
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
