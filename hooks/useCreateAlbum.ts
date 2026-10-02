"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArquivoResponseDTO, AlbumResumoDTO } from "@/types/api";
import { photoService } from "@/services/photoService";
import { albumService } from "@/services/albumService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateAlbum() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

	const [nome, setNome] = useState("");
	const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(
		new Set(),
	);
	const [localError, setLocalError] = useState<string | null>(null);

	// Carrega fotos do usuário utilizando o React Query (reaproveitando o cache de photos)
	const {
		data: userPhotos = [],
		isLoading: loadingPhotos,
		error: queryError,
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

	// Aplica pré-seleção se vier na query string
	useEffect(() => {
		const preSelected = searchParams.get("selectedPhotos");
		if (preSelected) {
			const ids = preSelected
				.split(",")
				.map((id) => Number(id.trim()))
				.filter((id) => !isNaN(id));
			setSelectedPhotoIds(new Set(ids));
		}
	}, [searchParams]);

	const togglePhoto = useCallback((id: number) => {
		setSelectedPhotoIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const createAlbumMutation = useMutation({
		mutationFn: async () => {
			const idsArray = Array.from(selectedPhotoIds);
			return await albumService.createAlbum(nome.trim(), idsArray);
		},
		onSuccess: (newAlbum) => {
			// Adiciona o novo álbum ao cache local da listagem de "meus álbuns"
			queryClient.setQueryData<AlbumResumoDTO[]>(
				["albums", "my"],
				(prev = []) => {
					return [newAlbum, ...prev];
				},
			);
			router.push(`/albuns/${newAlbum.id}`);
		},
		onError: (err: any) => {
			console.error("Erro ao criar álbum:", err);
			setLocalError(
				err.response?.data?.error ||
					"Erro ao criar álbum. Tente novamente.",
			);
		},
	});

	const createAlbum = useCallback(async () => {
		if (!nome.trim()) {
			setLocalError("Por favor, digite um nome para o álbum.");
			return;
		}

		if (selectedPhotoIds.size === 0) {
			setLocalError("Selecione pelo menos uma foto para compor o álbum.");
			return;
		}

		setLocalError(null);
		await createAlbumMutation.mutateAsync();
	}, [nome, selectedPhotoIds, createAlbumMutation]);

	const error = localError || (queryError ? "Não foi possível carregar as fotos para seleção." : null);

	return {
		nome,
		setNome,
		userPhotos,
		selectedPhotoIds,
		loadingPhotos,
		creating: createAlbumMutation.isPending,
		error,
		togglePhoto,
		createAlbum,
	};
}
