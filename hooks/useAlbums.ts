"use client";

import { useState, useMemo, useCallback } from "react";
import { AlbumResumoDTO } from "@/types/api";
import { albumService } from "@/services/albumService";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

export type AlbumTab = "all" | "my" | "shared";

export function useAlbums() {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<AlbumTab>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");

	const {
		data: myAlbums = [],
		isLoading: loadingMy,
		error: myError,
		refetch: refetchMy,
	} = useQuery<AlbumResumoDTO[]>({
		queryKey: ["albums", "my"],
		queryFn: async () => {
			const data = await albumService.getMyAlbums();
			return Array.isArray(data) ? data : [];
		},
		staleTime: 8 * 60 * 1000,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	const {
		data: sharedAlbums = [],
		isLoading: loadingShared,
		error: sharedError,
		refetch: refetchShared,
	} = useQuery<AlbumResumoDTO[]>({
		queryKey: ["albums", "shared"],
		queryFn: async () => {
			const data = await albumService.getSharedAlbums();
			return Array.isArray(data) ? data : [];
		},
		staleTime: 8 * 60 * 1000,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	const loading = loadingMy || loadingShared;
	const error =
		myError || sharedError
			? "Não foi possível carregar os álbuns. Verifique sua conexão."
			: null;

	const fetchAlbums = useCallback(async () => {
		await Promise.all([refetchMy(), refetchShared()]);
	}, [refetchMy, refetchShared]);

	const filteredMyAlbums = useMemo(() => {
		if (!searchQuery.trim()) return myAlbums;
		const query = searchQuery.toLowerCase();
		return myAlbums.filter((album) =>
			album.nome?.toLowerCase().includes(query),
		);
	}, [myAlbums, searchQuery]);

	const filteredSharedAlbums = useMemo(() => {
		if (!searchQuery.trim()) return sharedAlbums;
		const query = searchQuery.toLowerCase();
		return sharedAlbums.filter((album) =>
			album.nome?.toLowerCase().includes(query),
		);
	}, [sharedAlbums, searchQuery]);

    // Keep filteredAlbums for backward compatibility in the hook if needed,
    // though the page will now use the individual filtered lists.
	const currentAlbums = activeTab === "my" ? myAlbums :
	                      activeTab === "shared" ? sharedAlbums :
	                      [...myAlbums, ...sharedAlbums];

	const filteredAlbums = activeTab === "my" ? filteredMyAlbums :
	                       activeTab === "shared" ? filteredSharedAlbums :
	                       [...filteredMyAlbums, ...filteredSharedAlbums];

	const deleteAlbumMutation = useMutation({
		mutationFn: async (id: number) => {
			await albumService.deleteAlbum(id);
			return id;
		},
		onSuccess: (id) => {
			queryClient.setQueryData<AlbumResumoDTO[]>(
				["albums", "my"],
				(prev = []) => prev.filter((a) => a.id !== id),
			);
			queryClient.setQueryData<AlbumResumoDTO[]>(
				["albums", "shared"],
				(prev = []) => prev.filter((a) => a.id !== id),
			);
		},
		onError: (err) => {
			console.error("Erro ao deletar Álbum:", err);
		}
	});

	const deleteAlbum = useCallback(
		async (id: number) => {
			await deleteAlbumMutation.mutateAsync(id);
		},
		[deleteAlbumMutation],
	);

	const downloadAlbum = useCallback(async (id: number, nome: string) => {
		try {
			await albumService.downloadAlbumZip(id, nome);
		} catch (err) {
			console.error("Erro ao baixar Álbum:", err);
			throw err;
		}
	}, []);

	return {
		activeTab,
		setActiveTab,
		myAlbums,
		sharedAlbums,
		filteredAlbums,
		filteredMyAlbums,
		filteredSharedAlbums,
		loading,
		error,
		searchQuery,
		setSearchQuery,
		fetchAlbums,
		deleteAlbum,
		downloadAlbum,
	};
}
