"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ArquivoResponseDTO, AlbumDetalhadoDTO } from "@/types/api";
import { photoService } from "@/services/photoService";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type LayoutMode = "justified" | "columns" | "masonry" | "mosaic";
export type Orientation = "panorama" | "landscape" | "square" | "portrait";

export interface PhotoMeta {
	width: number;
	height: number;
	ratio: number;
	orientation: Orientation;
	isLoaded: boolean;
	hasError: boolean;
}

export function usePhotos() {
	const queryClient = useQueryClient();

	const {
		data: photos = [],
		isLoading: loading,
		error: queryError,
		refetch,
	} = useQuery<ArquivoResponseDTO[]>({
		queryKey: ["photos"],
		queryFn: async () => {
			const data = await photoService.getPhotos();
			return Array.isArray(data) ? data : [];
		},
		staleTime: 8 * 60 * 1000,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	const fetchPhotos = useCallback(async () => {
		await refetch();
	}, [refetch]);

	const error = queryError ? "Erro ao conectar com o servidor para buscar fotos." : null;

	const [searchQuery, setSearchQuery] = useState<string>("");
	const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
	const [metaMap, setMetaMap] = useState<Record<number, PhotoMeta>>({});
	const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
		null,
	);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

	// Upload State
	const [uploading, setUploading] = useState<boolean>(false);
	const [uploadProgress, setUploadProgress] = useState<number>(0);

	// Dimension detection for react-photo-album
	const updatePhotoDimensions = useCallback(
		(id: number, width: number, height: number) => {
			const safeWidth = width > 0 ? width : 1200;
			const safeHeight = height > 0 ? height : 800;
			const ratio = safeWidth / safeHeight;

			let orientation: Orientation = "landscape";
			if (ratio >= 1.75) {
				orientation = "panorama";
			} else if (ratio >= 1.15) {
				orientation = "landscape";
			} else if (ratio >= 0.85) {
				orientation = "square";
			} else {
				orientation = "portrait";
			}

			setMetaMap((prev) => {
				if (prev[id]?.isLoaded && prev[id]?.width === safeWidth)
					return prev;
				return {
					...prev,
					[id]: {
						width: safeWidth,
						height: safeHeight,
						ratio,
						orientation,
						isLoaded: true,
						hasError: false,
					},
				};
			});
		},
		[],
	);

	const markPhotoError = useCallback((id: number) => {
		setMetaMap((prev) => ({
			...prev,
			[id]: {
				width: 1200,
				height: 800,
				ratio: 1.5,
				orientation: "landscape",
				isLoaded: true,
				hasError: true,
			},
		}));
	}, []);

	// Preload dimensions in background
	useEffect(() => {
		if (typeof window === "undefined") return;

		photos.forEach((photo) => {
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
			img.onerror = () => {
				markPhotoError(photo.id);
			};
		});
	}, [photos, metaMap, updatePhotoDimensions, markPhotoError]);

	// Filtered photos based on search query
	const filteredPhotos = useMemo(() => {
		if (!searchQuery.trim()) return photos;
		const query = searchQuery.toLowerCase();
		return photos.filter((p) => p.nome?.toLowerCase().includes(query));
	}, [photos, searchQuery]);

	// Selection handlers
	const toggleSelect = useCallback((id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const selectAll = useCallback(() => {
		setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
	}, [filteredPhotos]);

	const clearSelection = useCallback(() => {
		setSelectedIds(new Set());
	}, []);

	// Upload action
	const uploadPhotos = useCallback(async (files: File[]) => {
		if (files.length === 0) return;
		setUploading(true);
		setUploadProgress(0);
		try {
			if (files.length === 1) {
				const newPhoto = await photoService.uploadPhoto(files[0]);
				queryClient.setQueryData<ArquivoResponseDTO[]>(["photos"], (prev = []) => [newPhoto, ...prev]);
			} else {
				const newPhotos = await photoService.uploadPhotosBatch(
					files,
					(percent) => {
						setUploadProgress(percent);
					},
				);
				queryClient.setQueryData<ArquivoResponseDTO[]>(["photos"], (prev = []) => [...newPhotos, ...prev]);
			}
			return true;
		} catch (err) {
			console.error("Erro no upload:", err);
			throw err;
		} finally {
			setUploading(false);
			setUploadProgress(0);
		}
	}, [queryClient]);

	// Delete single photo
	const deletePhoto = useCallback(
		async (id: number) => {
			try {
				await photoService.deletePhoto(id);
				
				// Remove from photos cache
				queryClient.setQueryData<ArquivoResponseDTO[]>(["photos"], (prev = []) => prev.filter((p) => p.id !== id));
				
				// Remove from all album details caches
				queryClient.setQueriesData<AlbumDetalhadoDTO>(
					{ queryKey: ["albumDetails"] },
					(oldData) => {
						if (!oldData) return oldData;
						const filteredImages = oldData.images.filter(img => img.id !== id);
						if (filteredImages.length === oldData.images.length) return oldData;
						
						return {
							...oldData,
							images: filteredImages,
							capa: oldData.capa?.id === id ? (filteredImages[0] || null) : oldData.capa
						};
					}
				);

				setSelectedIds((prev) => {
					const next = new Set(prev);
					next.delete(id);
					return next;
				});
				if (selectedPhotoIndex !== null) {
					setSelectedPhotoIndex(null);
				}
			} catch (err) {
				console.error("Erro ao deletar foto:", err);
				throw err;
			}
		},
		[queryClient, selectedPhotoIndex],
	);

	// Delete selected photos
	const deleteSelectedPhotos = useCallback(async () => {
		if (selectedIds.size === 0) return;
		const idsArray = Array.from(selectedIds);
		try {
			await photoService.deletePhotosBatch(idsArray);
			
			// Remove from photos cache
			queryClient.setQueryData<ArquivoResponseDTO[]>(["photos"], (prev = []) => prev.filter((p) => !selectedIds.has(p.id)));
			
			// Remove from all album details caches
			queryClient.setQueriesData<AlbumDetalhadoDTO>(
				{ queryKey: ["albumDetails"] },
				(oldData) => {
					if (!oldData) return oldData;
					const filteredImages = oldData.images.filter(img => !selectedIds.has(img.id));
					if (filteredImages.length === oldData.images.length) return oldData;
					
					return {
						...oldData,
						images: filteredImages,
						capa: oldData.capa && selectedIds.has(oldData.capa.id) ? (filteredImages[0] || null) : oldData.capa
					};
				}
			);

			clearSelection();
		} catch (err) {
			console.error("Erro ao deletar fotos em lote:", err);
			throw err;
		}
	}, [queryClient, selectedIds, clearSelection]);

	// Download photo
	const downloadPhoto = useCallback(async (id: number, filename?: string) => {
		try {
			await photoService.downloadPhoto(id, filename);
		} catch (err) {
			console.error("Erro ao baixar foto:", err);
			throw err;
		}
	}, []);

	// Download selected photos as zip
	const downloadSelectedPhotos = useCallback(
		async (filename = "fotos_selecionadas.zip") => {
			if (selectedIds.size === 0) return;
			const idsArray = Array.from(selectedIds);
			try {
				await photoService.downloadPhotosBatch(idsArray, filename);
			} catch (err) {
				console.error("Erro ao baixar fotos em lote:", err);
				throw err;
			}
		},
		[selectedIds],
	);

	return {
		photos,
		filteredPhotos,
		loading,
		error,
		searchQuery,
		setSearchQuery,
		layoutMode,
		setLayoutMode,
		metaMap,
		selectedPhotoIndex,
		setSelectedPhotoIndex,
		selectedIds,
		toggleSelect,
		selectAll,
		clearSelection,
		uploading,
		uploadProgress,
		uploadPhotos,
		deletePhoto,
		deleteSelectedPhotos,
		downloadPhoto,
		downloadSelectedPhotos,
		fetchPhotos,
		updatePhotoDimensions,
		markPhotoError,
	};
}
