import React, { useState, useMemo } from "react";
import * as Icon from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { albumService } from "@/services/albumService";
import { AlbumResumoDTO } from "@/types/api";
import { useRouter } from "next/navigation";

interface AddToAlbumModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedIds: Set<number>;
	onSuccess?: () => void;
}

export default function AddToAlbumModal({
	isOpen,
	onClose,
	selectedIds,
	onSuccess,
}: AddToAlbumModalProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState("");
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { data: myAlbums = [], isLoading: loadingMy } = useQuery<AlbumResumoDTO[]>({
		queryKey: ["albums", "my"],
		queryFn: async () => {
			const data = await albumService.getMyAlbums();
			return Array.isArray(data) ? data : [];
		},
		enabled: isOpen,
		staleTime: 8 * 60 * 1000,
	});

	const { data: sharedAlbums = [], isLoading: loadingShared } = useQuery<AlbumResumoDTO[]>({
		queryKey: ["albums", "shared"],
		queryFn: async () => {
			const data = await albumService.getSharedAlbums();
			return Array.isArray(data) ? data : [];
		},
		enabled: isOpen,
		staleTime: 8 * 60 * 1000,
	});

	const loading = loadingMy || loadingShared;

	const filteredAlbums = useMemo(() => {
		const all = [...myAlbums, ...sharedAlbums];
		if (!searchQuery.trim()) return all;
		const query = searchQuery.toLowerCase();
		return all.filter((a) => a.nome?.toLowerCase().includes(query));
	}, [myAlbums, sharedAlbums, searchQuery]);

	const addMutation = useMutation({
		mutationFn: async (albumId: number) => {
			const idsArray = Array.from(selectedIds);
			await albumService.addPhotosBatchToAlbum(albumId, idsArray);
			return albumId;
		},
		onSuccess: (albumId) => {
			const allPhotos = queryClient.getQueryData<any[]>(["photos"]) || [];
			const addedPhotos = allPhotos.filter(p => selectedIds.has(p.id));

			if (addedPhotos.length > 0) {
				// 1. Atualizar detalhes do álbum se ele estiver em cache
				queryClient.setQueryData<any>(
					["albumDetails", albumId],
					(oldData: any) => {
						if (!oldData) return oldData;
						
						const existingIds = new Set(oldData.images.map((img: any) => img.id));
						const newPhotos = addedPhotos.filter(p => !existingIds.has(p.id));

						return {
							...oldData,
							images: [...newPhotos, ...oldData.images],
							capa: oldData.capa || newPhotos[0] || null
						};
					}
				);

				// 2. Atualizar listagem de álbuns (para colocar a capa se estiver sem)
				const updateAlbumsCache = (prev: AlbumResumoDTO[] = []) => {
					return prev.map(album => {
						if (album.id === albumId && !album.capaUrl) {
							return { ...album, capaUrl: addedPhotos[0].url };
						}
						return album;
					});
				};

				queryClient.setQueryData<AlbumResumoDTO[]>(["albums", "my"], updateAlbumsCache);
				queryClient.setQueryData<AlbumResumoDTO[]>(["albums", "shared"], updateAlbumsCache);
			}

			// Invalida para forçar um refresh no background caso o usuário navegue
			queryClient.invalidateQueries({ queryKey: ["albumDetails", albumId] });
			
			onSuccess?.();
			onClose();
		},
		onError: (err: any) => {
			console.error("Erro ao adicionar fotos ao álbum:", err);
			setError(err.response?.data?.error || "Erro ao adicionar fotos ao álbum.");
		}
	});

	const handleAddToExisting = async (albumId: number) => {
		setCreating(true);
		setError(null);
		try {
			await addMutation.mutateAsync(albumId);
		} finally {
			setCreating(false);
		}
	};

	const handleCreateNew = () => {
		onClose();
		router.push(`/albuns/novo?selectedPhotos=${Array.from(selectedIds).join(",")}`);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
				onClick={!creating ? onClose : undefined}
			/>

			<div className="relative w-full max-w-md bg-background2 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
				<div className="flex items-center justify-between p-5 border-b border-surface1/60">
					<div>
						<h3 className="text-lg font-bold text-foreground">
							Adicionar ao Álbum
						</h3>
						<p className="text-xs text-foreground2 mt-1">
							{selectedIds.size} foto(s) selecionada(s)
						</p>
					</div>
					<button
						onClick={!creating ? onClose : undefined}
						disabled={creating}
						className="p-2 rounded-full hover:bg-surface1 text-foreground2 hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
					>
						<Icon.X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-hidden">
					{error && (
						<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
							<Icon.AlertCircle className="w-4 h-4 flex-shrink-0" />
							<span>{error}</span>
						</div>
					)}

					<button
						onClick={handleCreateNew}
						disabled={creating}
						className="w-full flex items-center gap-3 p-3 rounded-2xl bg-selected-surface text-selected-surface2 hover:opacity-90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
					>
						<div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
							<Icon.Plus className="w-5 h-5" />
						</div>
						<div className="flex flex-col items-start">
							<span className="text-sm font-bold">Criar novo álbum</span>
							<span className="text-xs opacity-80">Criar um álbum com estas fotos</span>
						</div>
					</button>

					<div className="flex items-center gap-3">
						<div className="h-px bg-surface1/60 flex-1" />
						<span className="text-xs font-semibold text-foreground2">ou escolha um existente</span>
						<div className="h-px bg-surface1/60 flex-1" />
					</div>

					<div className="relative shrink-0">
						<Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground2" />
						<input
							type="text"
							placeholder="Buscar álbum..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-surface1/80 text-foreground placeholder:text-foreground2/60 text-xs rounded-full pl-9 pr-4 py-2 border border-transparent focus:border-selected-surface2 focus:outline-none transition-all"
						/>
					</div>

					<div className="flex-1 overflow-y-auto min-h-[150px] -mx-2 px-2 flex flex-col gap-1">
						{loading ? (
							<div className="flex items-center justify-center h-20">
								<Icon.Loader2 className="w-5 h-5 animate-spin text-foreground2" />
							</div>
						) : filteredAlbums.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-32 text-center">
								<Icon.FolderX className="w-6 h-6 text-foreground2/50 mb-2" />
								<p className="text-xs text-foreground2">Nenhum álbum encontrado.</p>
							</div>
						) : (
							filteredAlbums.map((album) => (
								<button
									key={album.id}
									onClick={() => handleAddToExisting(album.id)}
									disabled={creating}
									className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-surface1 transition-colors disabled:opacity-50 text-left group cursor-pointer"
								>
									<div className="w-10 h-10 rounded-xl bg-surface1 overflow-hidden flex-shrink-0 border border-white/5 relative flex items-center justify-center">
										{album.capaUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={album.capaUrl}
												alt={album.nome}
												className="w-full h-full object-cover"
											/>
										) : (
											<Icon.Folder className="w-4 h-4 text-foreground2" />
										)}
									</div>
									<div className="flex-1 truncate">
										<span className="text-sm font-medium text-foreground group-hover:text-selected-surface2 transition-colors">
											{album.nome}
										</span>
									</div>
									{creating ? (
										<Icon.Loader2 className="w-4 h-4 text-foreground2 animate-spin" />
									) : (
										<Icon.ChevronRight className="w-4 h-4 text-foreground2 group-hover:text-selected-surface2 transition-colors" />
									)}
								</button>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
