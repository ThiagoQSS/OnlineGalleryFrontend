"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArquivoResponseDTO } from "@/types/api";
import { photoService } from "@/services/photoService";
import { albumService } from "@/services/albumService";

export function useCreateAlbum() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [nome, setNome] = useState("");
	const [userPhotos, setUserPhotos] = useState<ArquivoResponseDTO[]>([]);
	const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
	const [loadingPhotos, setLoadingPhotos] = useState(true);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Carrega fotos do usuário e aplica pré-seleção se vier na query string
	useEffect(() => {
		let isMounted = true;
		photoService
			.getPhotos()
			.then((photos) => {
				if (!isMounted) return;
				setUserPhotos(Array.isArray(photos) ? photos : []);

				const preSelected = searchParams.get("selectedPhotos");
				if (preSelected) {
					const ids = preSelected
						.split(",")
						.map((id) => Number(id.trim()))
						.filter((id) => !isNaN(id));
					setSelectedPhotoIds(new Set(ids));
				}
				setLoadingPhotos(false);
			})
			.catch((err) => {
				if (isMounted) {
					console.error("Erro ao carregar fotos:", err);
					setError("Não foi possível carregar as fotos para seleção.");
					setLoadingPhotos(false);
				}
			});

		return () => {
			isMounted = false;
		};
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

	const createAlbum = useCallback(async () => {
		if (!nome.trim()) {
			setError("Por favor, digite um nome para o álbum.");
			return;
		}

		if (selectedPhotoIds.size === 0) {
			setError("Selecione pelo menos uma foto para compor o álbum.");
			return;
		}

		setCreating(true);
		setError(null);

		try {
			const idsArray = Array.from(selectedPhotoIds);
			const newAlbum = await albumService.createAlbum(nome.trim(), idsArray);
			router.push(`/albums/${newAlbum.id}`);
		} catch (err: unknown) {
			console.error("Erro ao criar álbum:", err);
			const error = err as { response?: { data?: { error?: string } } };
			setError(error.response?.data?.error || "Erro ao criar álbum. Tente novamente.");
		} finally {
			setCreating(false);
		}
	}, [nome, selectedPhotoIds, router]);

	return {
		nome,
		setNome,
		userPhotos,
		selectedPhotoIds,
		loadingPhotos,
		creating,
		error,
		togglePhoto,
		createAlbum,
	};
}
