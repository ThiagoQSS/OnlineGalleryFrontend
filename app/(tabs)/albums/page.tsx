"use client";

import React, { useState } from "react";
import Link from "next/link";
import * as Icon from "lucide-react";
import { useAlbums } from "@/hooks/useAlbums";
import AlbumCard from "@/components/albums/AlbumCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AlbumsPage() {
	const {
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
	} = useAlbums();

	const [deleteAlbumId, setDeleteAlbumId] = useState<number | null>(null);
	const [deletingLoading, setDeletingLoading] = useState(false);

	const handleConfirmDelete = async () => {
		if (!deleteAlbumId) return;
		setDeletingLoading(true);
		try {
			await deleteAlbum(deleteAlbumId);
			setDeleteAlbumId(null);
		} catch (err) {
			console.error("Erro ao deletar álbum:", err);
		} finally {
			setDeletingLoading(false);
		}
	};

	return (
		<div className="w-full flex flex-col gap-6 relative">
			{/* Barra Superior */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-surface1/60">
				<div className="flex items-center gap-3">
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
							Álbuns
							<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface1 text-foreground2">
								{filteredAlbums.length}
							</span>
						</h2>
						<p className="text-xs text-foreground2 mt-0.5">
							Organize momentos especiais e colabore com outras pessoas
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
					{/* Campo de Busca */}
					<div className="relative flex-1 sm:w-60">
						<Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground2" />
						<input
							type="text"
							placeholder="Buscar álbuns por nome..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-surface1/80 text-foreground placeholder:text-foreground2/60 text-xs rounded-full pl-9 pr-8 py-2 border border-transparent focus:border-selected-surface2 focus:outline-none transition-all"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground2 hover:text-foreground p-0.5 cursor-pointer"
								title="Limpar busca"
							>
								<Icon.X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					{/* Botão Novo Álbum */}
					<Link
						href="/albums/novo"
						className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer"
					>
						<Icon.FolderPlus className="w-4 h-4" />
						<span>Criar Álbum</span>
					</Link>

					{/* Botão Atualizar */}
					<button
						onClick={fetchAlbums}
						disabled={loading}
						className="p-2 rounded-full bg-surface1 hover:bg-surface1/80 text-foreground2 hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
						title="Recarregar álbuns"
					>
						<Icon.RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
					</button>
				</div>
			</div>

			{/* Abas: Meus Álbuns / Compartilhados */}
			<div className="flex items-center gap-2 border-b border-surface1/40 pb-2">
				<button
					type="button"
					onClick={() => setActiveTab("my")}
					className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
						activeTab === "my"
							? "bg-selected-surface text-selected-surface2 shadow-sm"
							: "text-foreground2 hover:text-foreground hover:bg-surface1"
					}`}
				>
					<Icon.Folder className="w-3.5 h-3.5" />
					<span>Meus Álbuns</span>
					<span className="text-[10px] px-2 py-0.5 rounded-full bg-surface1 text-foreground2">
						{myAlbums.length}
					</span>
				</button>

				<button
					type="button"
					onClick={() => setActiveTab("shared")}
					className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
						activeTab === "shared"
							? "bg-selected-surface text-selected-surface2 shadow-sm"
							: "text-foreground2 hover:text-foreground hover:bg-surface1"
					}`}
				>
					<Icon.Users className="w-3.5 h-3.5" />
					<span>Compartilhados Comigo</span>
					<span className="text-[10px] px-2 py-0.5 rounded-full bg-surface1 text-foreground2">
						{sharedAlbums.length}
					</span>
				</button>
			</div>

			{/* Erro */}
			{error && (
				<div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
					<div className="flex items-center gap-2">
						<Icon.AlertCircle className="w-5 h-5 flex-shrink-0" />
						<span>{error}</span>
					</div>
					<button
						onClick={fetchAlbums}
						className="px-3 py-1 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-all cursor-pointer"
					>
						Tentar novamente
					</button>
				</div>
			)}

			{/* Skeleton Loading */}
			{loading && (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
					{[...Array(8)].map((_, i) => (
						<div
							key={i}
							className="rounded-3xl bg-surface1/60 aspect-4/3 animate-pulse border border-white/5 relative overflow-hidden"
						>
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
						</div>
					))}
				</div>
			)}

			{/* Estado Vazio */}
			{!loading && filteredAlbums.length === 0 && (
				<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
					<div className="w-16 h-16 rounded-full bg-surface1/80 flex items-center justify-center mb-4 text-foreground2">
						<Icon.Album className="w-8 h-8 opacity-70" />
					</div>
					<h3 className="text-lg font-semibold text-foreground">
						{searchQuery
							? "Nenhum álbum encontrado para a busca"
							: activeTab === "my"
								? "Você ainda não criou nenhum álbum"
								: "Nenhum álbum compartilhado com você"}
					</h3>
					<p className="text-sm text-foreground2 max-w-sm mt-1 mb-6">
						{searchQuery
							? `Não encontramos álbuns com o termo "${searchQuery}". Tente outro nome.`
							: activeTab === "my"
								? "Crie seu primeiro álbum selecionando fotos da sua galeria."
								: "Quando alguém convidar você para colaborar em um álbum, ele aparecerá aqui."}
					</p>

					{activeTab === "my" && !searchQuery && (
						<Link
							href="/albums/novo"
							className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
						>
							<Icon.FolderPlus className="w-4 h-4" />
							Criar novo álbum
						</Link>
					)}
				</div>
			)}

			{/* Grid de Álbuns */}
			{!loading && filteredAlbums.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
					{filteredAlbums.map((album) => (
						<AlbumCard
							key={album.id}
							album={album}
							isShared={activeTab === "shared"}
							onDownload={downloadAlbum}
							onDelete={(id) => setDeleteAlbumId(id)}
						/>
					))}
				</div>
			)}

			{/* Dialog de Confirmação para Deletar Álbum */}
			<ConfirmDialog
				isOpen={deleteAlbumId !== null}
				title="Excluir álbum?"
				message="Tem certeza que deseja excluir permanentemente este álbum? As fotos continuarão salvas na sua galeria individual."
				confirmText="Excluir Álbum"
				isDestructive
				loading={deletingLoading}
				onConfirm={handleConfirmDelete}
				onCancel={() => setDeleteAlbumId(null)}
			/>
		</div>
	);
}