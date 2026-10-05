"use client";

import React, { useState } from "react";
import * as Icon from "lucide-react";
import { usePhotos } from "@/hooks/usePhotos";
import PhotoGallery from "@/components/photos/PhotoGallery";
import PhotoLightbox from "@/components/photos/PhotoLightbox";
import PhotoUploadModal from "@/components/photos/PhotoUploadModal";
import PhotoBatchBar from "@/components/photos/PhotoBatchBar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AddToAlbumModal from "@/components/photos/AddToAlbumModal";
import { useRouter } from "next/navigation";

export default function PhotosPage() {
	const router = useRouter();
	const {
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
	} = usePhotos();

	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		isOpen: boolean;
		singleId?: number;
		isBatch?: boolean;
	}>({ isOpen: false });
	const [deletingLoading, setDeletingLoading] = useState(false);

	const handleDeleteSingle = (id: number) => {
		setDeleteConfirm({
			isOpen: true,
			singleId: id,
			isBatch: false,
		});
	};

	const handleDeleteBatch = () => {
		setDeleteConfirm({
			isOpen: true,
			isBatch: true,
		});
	};

	const handleConfirmDelete = async () => {
		setDeletingLoading(true);
		try {
			if (deleteConfirm.isBatch) {
				await deleteSelectedPhotos();
			} else if (deleteConfirm.singleId) {
				await deletePhoto(deleteConfirm.singleId);
			}
			setDeleteConfirm({ isOpen: false });
		} catch (err) {
			console.error("Erro ao deletar:", err);
		} finally {
			setDeletingLoading(false);
		}
	};

	return (
		<div className="w-full flex flex-col gap-6 relative">
			{/* Barra Superior: Título, Busca, Ações e Modos de Layout */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-surface1/60">
				<div className="flex items-center gap-3">
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
							Fotos
							<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface1 text-foreground2">
								{filteredPhotos.length}
							</span>
						</h2>
						<p className="text-xs text-foreground2 mt-0.5">
							Faça upload de suas fotos e as organize em álbuns
							compartilháveis.
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
					{/* Campo de Busca */}
					<div className="relative flex-1 sm:w-60">
						<Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground2" />
						<input
							type="text"
							placeholder="Buscar fotos por nome..."
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

					{/* Botão de Upload */}
					<button
						onClick={() => setIsUploadOpen(true)}
						className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer"
						title="Fazer upload de novas fotos"
					>
						<Icon.UploadCloud className="w-4 h-4" />
						<span>Enviar fotos</span>
					</button>

					{/* Botão de Atualizar */}
					<button
						onClick={fetchPhotos}
						disabled={loading}
						className="p-2 rounded-full bg-surface1 hover:bg-surface1/80 text-foreground2 hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
						title="Recarregar fotos"
					>
						<Icon.RefreshCw
							className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
						/>
					</button>

					{/* Modos de Layout */}
					<div className="flex items-center bg-surface1 p-1 rounded-full gap-0.5">
						<button
							onClick={() => setLayoutMode("justified")}
							title="Justificada"
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
								layoutMode === "justified"
									? "bg-selected-surface text-selected-surface2 shadow-sm"
									: "text-foreground2 hover:text-foreground"
							}`}
						>
							<Icon.Maximize className="w-3.5 h-3.5" />
							<span className="hidden md:inline">
								Justificada
							</span>
						</button>

						<button
							onClick={() => setLayoutMode("columns")}
							title="Colunas Proporcionais"
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
								layoutMode === "columns"
									? "bg-selected-surface text-selected-surface2 shadow-sm"
									: "text-foreground2 hover:text-foreground"
							}`}
						>
							<Icon.Columns3 className="w-3.5 h-3.5" />
							<span className="hidden md:inline">Colunas</span>
						</button>

						<button
							onClick={() => setLayoutMode("masonry")}
							title="Masonry (Estilo Pinterest)"
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
								layoutMode === "masonry"
									? "bg-selected-surface text-selected-surface2 shadow-sm"
									: "text-foreground2 hover:text-foreground"
							}`}
						>
							<Icon.LayoutGrid className="w-3.5 h-3.5" />
							<span className="hidden md:inline">Masonry</span>
						</button>
					</div>
				</div>
			</div>

			{/* Mensagem de Erro */}
			{error && (
				<div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
					<div className="flex items-center gap-2">
						<Icon.AlertCircle className="w-5 h-5 flex-shrink-0" />
						<span>{error}</span>
					</div>
					<button
						onClick={fetchPhotos}
						className="px-3 py-1 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-all cursor-pointer"
					>
						Tentar novamente
					</button>
				</div>
			)}

			{/* Loading State: Skeletons adaptativos */}
			{loading && (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 auto-rows-[170px] gap-3.5">
					{[...Array(12)].map((_, i) => (
						<div
							key={i}
							className="rounded-2xl bg-surface1/60 animate-pulse border border-white/5 relative overflow-hidden"
						>
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
						</div>
					))}
				</div>
			)}

			{/* Estado Vazio */}
			{!loading && filteredPhotos.length === 0 && (
				<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
					<div className="w-16 h-16 rounded-full bg-surface1/80 flex items-center justify-center mb-4 text-foreground2">
						<Icon.ImageIcon className="w-8 h-8 opacity-70" />
					</div>
					<h3 className="text-lg font-semibold text-foreground">
						{searchQuery
							? "Nenhuma foto corresponde à busca"
							: "Sua galeria está vazia"}
					</h3>
					<p className="text-sm text-foreground2 max-w-sm mt-1 mb-6">
						{searchQuery
							? `Não encontramos fotos com o termo "${searchQuery}". Tente outro nome ou limpe o filtro.`
							: "Faça upload de fotos para visualizá-las aqui na sua galeria personalizada."}
					</p>
					{searchQuery ? (
						<button
							onClick={() => setSearchQuery("")}
							className="px-4 py-2 rounded-full bg-surface1 hover:bg-surface1/80 text-foreground text-xs font-semibold transition-all cursor-pointer"
						>
							Limpar busca
						</button>
					) : (
						<button
							onClick={() => setIsUploadOpen(true)}
							className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer"
						>
							<Icon.UploadCloud className="w-3.5 h-3.5" />
							Fazer upload agora
						</button>
					)}
				</div>
			)}

			{/* Galeria de Fotos com react-photo-album */}
			{!loading && filteredPhotos.length > 0 && (
				<PhotoGallery
					photos={filteredPhotos}
					layoutMode={layoutMode}
					metaMap={metaMap}
					selectedIds={selectedIds}
					onToggleSelect={toggleSelect}
					onPhotoClick={(idx) => setSelectedPhotoIndex(idx)}
					onDownloadPhoto={downloadPhoto}
					onDeletePhoto={handleDeleteSingle}
					onImageLoad={updatePhotoDimensions}
				/>
			)}

			{/* Modal de Lightbox para Visualização em Tela Cheia */}
			<PhotoLightbox
				photos={filteredPhotos}
				index={selectedPhotoIndex}
				onClose={() => setSelectedPhotoIndex(null)}
			/>

			{/* Barra Flutuante de Ações em Lote */}
			<PhotoBatchBar
				selectedCount={selectedIds.size}
				totalCount={filteredPhotos.length}
				onSelectAll={selectAll}
				onClearSelection={clearSelection}
				onDownloadSelected={() => downloadSelectedPhotos()}
				onDeleteSelected={handleDeleteBatch}
				onAddToAlbum={() => setIsAddToAlbumOpen(true)}
			/>

			<AddToAlbumModal
				isOpen={isAddToAlbumOpen}
				onClose={() => setIsAddToAlbumOpen(false)}
				selectedIds={selectedIds}
				onSuccess={() => {
					clearSelection();
				}}
			/>

			{/* Modal de Upload de Fotos */}
			<PhotoUploadModal
				isOpen={isUploadOpen}
				onClose={() => setIsUploadOpen(false)}
				onUpload={uploadPhotos}
				uploading={uploading}
				uploadProgress={uploadProgress}
			/>

			{/* Dialog de Confirmação de Exclusão */}
			<ConfirmDialog
				isOpen={deleteConfirm.isOpen}
				title={
					deleteConfirm.isBatch
						? "Excluir fotos selecionadas?"
						: "Excluir foto?"
				}
				message={
					deleteConfirm.isBatch
						? `Tem certeza que deseja excluir permanentemente ${selectedIds.size} foto(s)? Esta ação não poderá ser desfeita.`
						: "Tem certeza que deseja excluir esta foto permanentemente do seu armazenamento?"
				}
				confirmText="Excluir"
				isDestructive
				loading={deletingLoading}
				onConfirm={handleConfirmDelete}
				onCancel={() => setDeleteConfirm({ isOpen: false })}
			/>
		</div>
	);
}
