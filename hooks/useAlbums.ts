"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlbumResumoDTO } from "@/types/api";
import { albumService } from "@/services/albumService";

export type AlbumTab = "my" | "shared";

export function useAlbums() {
	const [activeTab, setActiveTab] = useState<AlbumTab>("my");
	const [myAlbums, setMyAlbums] = useState<AlbumResumoDTO[]>([]);
	const [sharedAlbums, setSharedAlbums] = useState<AlbumResumoDTO[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>("");

	const fetchAlbums = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [my, shared] = await Promise.all([
				albumService.getMyAlbums(),
				albumService.getSharedAlbums(),
			]);
			setMyAlbums(Array.isArray(my) ? my : []);
			setSharedAlbums(Array.isArray(shared) ? shared : []);
		} catch (err) {
			console.error("Erro ao buscar álbuns:", err);
			setError("Não foi possível carregar os álbuns. Verifique sua conexão.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		let isMounted = true;
		Promise.all([albumService.getMyAlbums(), albumService.getSharedAlbums()])
			.then(([my, shared]) => {
				if (isMounted) {
					setMyAlbums(Array.isArray(my) ? my : []);
					setSharedAlbums(Array.isArray(shared) ? shared : []);
					setLoading(false);
				}
			})
			.catch((err) => {
				if (isMounted) {
					console.error("Erro ao buscar álbuns:", err);
					setError("Não foi possível carregar os álbuns. Verifique sua conexão.");
					setLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, []);

	const currentAlbums = activeTab === "my" ? myAlbums : sharedAlbums;

	const filteredAlbums = useMemo(() => {
		if (!searchQuery.trim()) return currentAlbums;
		const query = searchQuery.toLowerCase();
		return currentAlbums.filter((album) => album.nome?.toLowerCase().includes(query));
	}, [currentAlbums, searchQuery]);

	const deleteAlbum = useCallback(async (id: number) => {
		try {
			await albumService.deleteAlbum(id);
			setMyAlbums((prev) => prev.filter((a) => a.id !== id));
		} catch (err) {
			console.error("Erro ao deletar álbum:", err);
			throw err;
		}
	}, []);

	const downloadAlbum = useCallback(async (id: number, nome: string) => {
		try {
			await albumService.downloadAlbumZip(id, nome);
		} catch (err) {
			console.error("Erro ao baixar álbum:", err);
			throw err;
		}
	}, []);

	return {
		activeTab,
		setActiveTab,
		myAlbums,
		sharedAlbums,
		filteredAlbums,
		loading,
		error,
		searchQuery,
		setSearchQuery,
		fetchAlbums,
		deleteAlbum,
		downloadAlbum,
	};
}
