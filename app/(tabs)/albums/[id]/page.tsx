"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as Icon from "lucide-react";
import { useAlbumDetails } from "@/hooks/useAlbumDetails";
import { useAuth } from "@/hooks/useAuth";
import { LayoutMode } from "@/hooks/usePhotos";
import PhotoGallery from "@/components/photos/PhotoGallery";
import PhotoLightbox from "@/components/photos/PhotoLightbox";
import PhotoBatchBar from "@/components/photos/PhotoBatchBar";
import AddPhotosToAlbumModal from "@/components/albums/AddPhotosToAlbumModal";
import CollaboratorsModal from "@/components/albums/CollaboratorsModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AlbumDetailsPage() {
	const params = useParams();
	const albumId = Number(params.id);
	const { user } = useAuth();

	const {
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
	} = useAlbumDetails(albumId);

	const [layoutMode, setLayoutMode] = useState<LayoutMode>("justified");
	const [isAddPhotosOpen, setIsAddPhotosOpen] = useState(false);
	const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		isOpen: boolean;
		type: "album" | "photo" | "batch_photos";
		singlePhotoId?: number;
	}>({ isOpen: false, type: "album" });
	const [actionLoading, setActionLoading] = useState(false);

	// Verifica se o usuário atual é o criador do álbum
	const isCreator = Boolean(
		album?.criador &&
		user &&
		(album.criador.id === user.id ||
			album.criador.email?.toLowerCase() === user.email?.toLowerCase()),
	);

	const existingPhotoIds = album?.images?.map((img) => img.id) || [];

	const handleConfirmAction = async () => {
		setActionLoading(true);
		try {
			if (deleteConfirm.type === "album") {
				await deleteAlbum();
			} else if (
				deleteConfirm.type === "photo" &&
				deleteConfirm.singlePhotoId
			) {
				await removePhotoFromAlbum(deleteConfirm.singlePhotoId);
			} else if (deleteConfirm.type === "batch_photos") {
				await removeSelectedPhotosFromAlbum();
			}
			setDeleteConfirm({ isOpen: false, type: "album" });
		} catch (err) {
			console.error("Erro na ação:", err);
		} finally {
			setActionLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="w-full flex flex-col gap-6 animate-pulse">
				<div className="h-10 w-48 bg-surface1/60 rounded-xl" />
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 auto-rows-[160px] gap-3.5">
					{[...Array(12)].map((_, i) => (
						<div key={i} className="rounded-2xl bg-surface1/60" />
					))}
				</div>
			</div>
		);
	}

	if (error || !album) {
		return (
			<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
				<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
					<Icon.AlertCircle className="w-8 h-8" />
				</div>
				<h3 className="text-lg font-semibold text-foreground">
					Álbum não encontrado
				</h3>
				<p className="text-sm text-foreground2 max-w-sm mt-1 mb-6">
					{error ||
						"O álbum solicitado não existe ou você não possui permissão para acessá-lo."}
				</p>
				<Link
					href="/albums"
					className="px-5 py-2.5 rounded-full bg-surface1 hover:bg-surface1/80 text-foreground text-xs font-semibold transition-all"
				>
					Voltar para todos os álbuns
				</Link>
			</div>
		);
	}

	return (
		<div className="w-full flex flex-col gap-6 relative">
			{/* Barra Superior e Cabeçalho do Álbum */}
			<div className="flex flex-col gap-4 pb-4 border-b border-surface1/60">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Link
							href="/albums"
							className="p-2 rounded-full hover:bg-surface1 text-foreground2 hover:text-foreground transition-colors"
							title="Voltar para álbuns"
						>
							<Icon.ArrowLeft className="w-5 h-5" />
						</Link>

						<div>
							<div className="flex items-center gap-2.5">
								<h2 className="text-2xl font-bold tracking-tight text-foreground">
									{album.name}
								</h2>
								<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface1 text-foreground2">
									{album.images.length} fotos
								</span>
								{isCreator ? (
									<span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-selected-surface text-selected-surface2">
										Criador
									</span>
								) : (
									<span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
										Convidado
									</span>
								)}
							</div>
							<p className="text-xs text-foreground2 mt-0.5">
								Criado por{" "}
								<span className="text-foreground">
									{album.criador.nome}
								</span>{" "}
								({album.criador.email})
							</p>
						</div>
					</div>

					{/* Botões de Ação */}
					<div className="flex flex-wrap items-center gap-2">
						{/* Adicionar Fotos */}
						<button
							type="button"
							onClick={() => setIsAddPhotosOpen(true)}
							className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer"
						>
							<Icon.Plus className="w-4 h-4" />
							<span>Adicionar Fotos</span>
						</button>

						{/* Colaboradores */}
						<button
							type="button"
							onClick={() => setIsCollaboratorsOpen(true)}
							className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface1 hover:bg-white/10 text-foreground text-xs font-semibold border border-white/10 transition-all cursor-pointer"
						>
							<Icon.Users className="w-4 h-4 text-foreground2" />
							<span>
								Colaboradores ({1 + album.convidados.length})
							</span>
						</button>

						{/* Baixar Álbum ZIP */}
						<button
							type="button"
							onClick={downloadAlbum}
							disabled={album.images.length === 0}
							className="p-2 rounded-full bg-surface1 hover:bg-surface1/80 text-foreground2 hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
							title="Baixar álbum completo (.zip)"
						>
							<Icon.Download className="w-4 h-4" />
						</button>

						{/* Recarregar */}
						<button
							type="button"
							onClick={fetchAlbum}
							className="p-2 rounded-full bg-surface1 hover:bg-surface1/80 text-foreground2 hover:text-foreground transition-all cursor-pointer"
							title="Atualizar dados do álbum"
						>
							<Icon.RefreshCw className="w-4 h-4" />
						</button>

						{/* Excluir Álbum (somente criador) */}
						{isCreator && (
							<button
								type="button"
								onClick={() =>
									setDeleteConfirm({
										isOpen: true,
										type: "album",
									})
								}
								className="p-2 rounded-full bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-all cursor-pointer"
								title="Excluir este álbum"
							>
								<Icon.Trash2 className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>

				{/* Seletor de layout */}
				{album.images.length > 0 && (
					<div className="flex items-center justify-end">
						<div className="flex items-center bg-surface1 p-1 rounded-full gap-0.5">
							<button
								onClick={() => setLayoutMode("justified")}
								title="Justificada"
								className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
									layoutMode === "justified"
										? "bg-selected-surface text-selected-surface2 shadow-sm"
										: "text-foreground2 hover:text-foreground"
								}`}
							>
								<Icon.Maximize className="w-3 h-3" />
								<span className="hidden sm:inline">
									Justificada
								</span>
							</button>

							<button
								onClick={() => setLayoutMode("columns")}
								title="Colunas"
								className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
									layoutMode === "columns"
										? "bg-selected-surface text-selected-surface2 shadow-sm"
										: "text-foreground2 hover:text-foreground"
								}`}
							>
								<Icon.Columns3 className="w-3 h-3" />
								<span className="hidden sm:inline">
									Colunas
								</span>
							</button>

							<button
								onClick={() => setLayoutMode("masonry")}
								title="Masonry"
								className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
									layoutMode === "masonry"
										? "bg-selected-surface text-selected-surface2 shadow-sm"
										: "text-foreground2 hover:text-foreground"
								}`}
							>
								<Icon.LayoutGrid className="w-3 h-3" />
								<span className="hidden sm:inline">
									Masonry
								</span>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Estado Vazio de Fotos */}
			{album.images.length === 0 && (
				<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
					<div className="w-16 h-16 rounded-full bg-surface1/80 flex items-center justify-center mb-4 text-foreground2">
						<Icon.ImageIcon className="w-8 h-8 opacity-70" />
					</div>
					<h3 className="text-lg font-semibold text-foreground">
						Este álbum ainda não possui fotos
					</h3>
					<p className="text-sm text-foreground2 max-w-sm mt-1 mb-6">
						Adicione fotos da sua galeria para preencher este álbum
						e começar a compartilhá-lo.
					</p>
					<button
						type="button"
						onClick={() => setIsAddPhotosOpen(true)}
						className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer"
					>
						<Icon.Plus className="w-4 h-4" />
						Adicionar fotos agora
					</button>
				</div>
			)}

			{/* Galeria de Fotos do Álbum */}
			{album.images.length > 0 && (
				<PhotoGallery
					photos={album.images}
					layoutMode={layoutMode}
					metaMap={metaMap}
					selectedIds={selectedPhotoIds}
					onToggleSelect={toggleSelectPhoto}
					onPhotoClick={(idx) => setSelectedPhotoIndex(idx)}
					onDeletePhoto={(id) =>
						setDeleteConfirm({
							isOpen: true,
							type: "photo",
							singlePhotoId: id,
						})
					}
					onImageLoad={updatePhotoDimensions}
				/>
			)}

			{/* Lightbox */}
			<PhotoLightbox
				photos={album.images}
				index={selectedPhotoIndex}
				onClose={() => setSelectedPhotoIndex(null)}
			/>

			{/* Barra Flutuante de Seleção no Álbum */}
			<PhotoBatchBar
				selectedCount={selectedPhotoIds.size}
				totalCount={album.images.length}
				onSelectAll={selectAllPhotos}
				onClearSelection={clearPhotoSelection}
				onDownloadSelected={downloadAlbum}
				onDeleteSelected={() =>
					setDeleteConfirm({
						isOpen: true,
						type: "batch_photos",
					})
				}
			/>

			{/* Modal para Adicionar Fotos ao Álbum */}
			<AddPhotosToAlbumModal
				isOpen={isAddPhotosOpen}
				onClose={() => setIsAddPhotosOpen(false)}
				existingPhotoIds={existingPhotoIds}
				onAddPhotos={addPhotosBatch}
			/>

			{/* Modal de Colaboradores */}
			<CollaboratorsModal
				isOpen={isCollaboratorsOpen}
				onClose={() => setIsCollaboratorsOpen(false)}
				criador={album.criador}
				convidados={album.convidados}
				isCreator={isCreator}
				onInvite={inviteCollaborator}
				onKick={kickCollaborator}
			/>

			{/* Confirmação de Exclusão */}
			<ConfirmDialog
				isOpen={deleteConfirm.isOpen}
				title={
					deleteConfirm.type === "album"
						? "Excluir Álbum?"
						: deleteConfirm.type === "batch_photos"
							? "Remover fotos selecionadas do álbum?"
							: "Remover foto do álbum?"
				}
				message={
					deleteConfirm.type === "album"
						? "Tem certeza que deseja excluir este álbum permanentemente? Suas fotos continuarão salvas na galeria principal."
						: deleteConfirm.type === "batch_photos"
							? `Deseja remover as ${selectedPhotoIds.size} foto(s) selecionadas deste álbum?`
							: "Deseja remover esta foto do álbum?"
				}
				confirmText={
					deleteConfirm.type === "album"
						? "Excluir Álbum"
						: "Remover do Álbum"
				}
				isDestructive
				loading={actionLoading}
				onConfirm={handleConfirmAction}
				onCancel={() =>
					setDeleteConfirm({ isOpen: false, type: "album" })
				}
			/>
		</div>
	);
}
