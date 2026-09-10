"use client";

import React, { useMemo } from "react";
import { RowsPhotoAlbum, ColumnsPhotoAlbum, MasonryPhotoAlbum, Photo } from "react-photo-album";
import "react-photo-album/rows.css";
import "react-photo-album/columns.css";
import "react-photo-album/masonry.css";
import * as Icon from "lucide-react";
import Image from "next/image";
import { ArquivoResponseDTO } from "@/types/api";
import { LayoutMode, PhotoMeta } from "@/hooks/usePhotos";

export interface GalleryPhotoItem extends Photo {
	raw: ArquivoResponseDTO;
}

interface PhotoGalleryProps {
	photos: ArquivoResponseDTO[];
	layoutMode: LayoutMode;
	metaMap: Record<number, PhotoMeta>;
	selectedIds?: Set<number>;
	onToggleSelect?: (id: number) => void;
	onPhotoClick: (index: number) => void;
	onDownloadPhoto?: (id: number, nome: string) => void;
	onDeletePhoto?: (id: number) => void;
	onImageLoad?: (id: number, width: number, height: number) => void;
	selectable?: boolean;
}

export default function PhotoGallery({
	photos,
	layoutMode,
	metaMap,
	selectedIds,
	onToggleSelect,
	onPhotoClick,
	onDownloadPhoto,
	onDeletePhoto,
	onImageLoad,
	selectable = true,
}: PhotoGalleryProps) {
	// Prepara a lista de fotos para a react-photo-album
	const albumPhotos: GalleryPhotoItem[] = useMemo(() => {
		return photos.map((p) => {
			const meta = metaMap[p.id];
			return {
				src: p.url,
				width: meta?.width || 1200,
				height: meta?.height || 800,
				key: String(p.id),
				raw: p,
			};
		});
	}, [photos, metaMap]);

	const formatDate = (dateInput: string | undefined): string => {
		if (!dateInput) return "";
		try {
			const d = new Date(dateInput);
			if (isNaN(d.getTime())) return "";
			return new Intl.DateTimeFormat("pt-BR", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}).format(d);
		} catch {
			return "";
		}
	};

	const renderCustomPhoto = (
		props: { onClick?: React.MouseEventHandler },
		context: { photo: GalleryPhotoItem; index: number; width: number; height: number },
	) => {
		const photoItem = context.photo;
		const raw = photoItem.raw;
		const isSelected = selectedIds?.has(raw.id) || false;
		const meta = metaMap[raw.id];

		let orientationBadge: string | null = null;
		if (meta?.orientation) {
			switch (meta.orientation) {
				case "panorama":
					orientationBadge = "Panorâmica";
					break;
				case "portrait":
					orientationBadge = "Retrato";
					break;
				case "landscape":
					orientationBadge = "Paisagem";
					break;
				case "square":
					orientationBadge = "Quadrada";
					break;
			}
		}

		return (
			<div
				className={`group relative overflow-hidden rounded-2xl bg-surface1/60 border transition-all duration-300 cursor-pointer select-none w-full h-full ${
					isSelected ? "border-selected-surface2 ring-2 ring-selected-surface2 shadow-lg" : "border-white/5 hover:shadow-xl"
				}`}
				onClick={props.onClick}
			>
				{/* Imagem */}
				<div className="relative w-full h-full min-h-[140px]">
					<Image
						src={raw.url}
						alt={raw.nome}
						fill
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
						unoptimized
						loading="lazy"
						onLoad={(e) => {
							const img = e.currentTarget;
							if (onImageLoad && img.naturalWidth && img.naturalHeight) {
								onImageLoad(raw.id, img.naturalWidth, img.naturalHeight);
							}
						}}
						className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
					/>
				</div>

				{/* Checkbox de seleção permanente quando selecionado, ou no hover */}
				{selectable && onToggleSelect && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onToggleSelect(raw.id);
						}}
						className={`absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
							isSelected
								? "bg-selected-surface2 text-selected-surface opacity-100 shadow-md scale-105"
								: "bg-black/50 text-white/80 border border-white/20 opacity-0 group-hover:opacity-100 hover:bg-black/70"
						}`}
						title={isSelected ? "Desmarcar foto" : "Selecionar foto"}
					>
						{isSelected ? (
							<Icon.Check className="w-4 h-4 stroke-[3]" />
						) : (
							<div className="w-2.5 h-2.5 rounded-xs border border-white/60" />
						)}
					</button>
				)}

				{/* Overlay gradiente que aparece no Hover */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 z-10 pointer-events-none">
					{/* Topo do Overlay */}
					<div className="flex items-center justify-between pointer-events-auto ml-7">
						{orientationBadge ? (
							<span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/50 text-white/90 backdrop-blur-sm border border-white/10">
								{orientationBadge}
							</span>
						) : (
							<span />
						)}

						<div className="flex items-center gap-1.5">
							{onDownloadPhoto && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										onDownloadPhoto(raw.id, raw.nome);
									}}
									className="w-7 h-7 rounded-full bg-black/50 hover:bg-white/20 text-white/90 flex items-center justify-center border border-white/10 transition-all cursor-pointer"
									title="Baixar imagem"
								>
									<Icon.Download className="w-3.5 h-3.5" />
								</button>
							)}

							{onDeletePhoto && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										onDeletePhoto(raw.id);
									}}
									className="w-7 h-7 rounded-full bg-black/50 hover:bg-red-500/80 text-white/90 flex items-center justify-center border border-white/10 transition-all cursor-pointer"
									title="Excluir imagem"
								>
									<Icon.Trash2 className="w-3.5 h-3.5" />
								</button>
							)}

							<div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white/90 flex items-center justify-center border border-white/10 transform scale-90 group-hover:scale-100 transition-transform">
								<Icon.Maximize2 className="w-3.5 h-3.5" />
							</div>
						</div>
					</div>

					{/* Rodapé do Overlay */}
					<div className="flex flex-col gap-0.5 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto">
						<p className="text-white text-xs font-semibold truncate drop-shadow-sm">
							{raw.nome}
						</p>
						{raw.dataCriacao && (
							<p className="text-white/70 text-[10px] flex items-center gap-1 drop-shadow-sm">
								<Icon.Calendar className="w-2.5 h-2.5" />
								{formatDate(raw.dataCriacao)}
							</p>
						)}
					</div>
				</div>
			</div>
		);
	};

	if (layoutMode === "columns") {
		return (
			<ColumnsPhotoAlbum
				photos={albumPhotos}
				spacing={14}
				columns={(containerWidth) => {
					if (containerWidth < 600) return 2;
					if (containerWidth < 900) return 3;
					if (containerWidth < 1200) return 4;
					return 5;
				}}
				onClick={({ index }) => onPhotoClick(index)}
				render={{ photo: renderCustomPhoto }}
			/>
		);
	}

	if (layoutMode === "masonry") {
		return (
			<MasonryPhotoAlbum
				photos={albumPhotos}
				spacing={14}
				columns={(containerWidth) => {
					if (containerWidth < 600) return 2;
					if (containerWidth < 900) return 3;
					if (containerWidth < 1200) return 4;
					return 5;
				}}
				onClick={({ index }) => onPhotoClick(index)}
				render={{ photo: renderCustomPhoto }}
			/>
		);
	}

	// Default: Justified / Rows layout (Google Photos style)
	return (
		<RowsPhotoAlbum
			photos={albumPhotos}
			spacing={14}
			targetRowHeight={(containerWidth) => {
				if (containerWidth < 600) return 160;
				if (containerWidth < 1024) return 200;
				return 240;
			}}
			rowConstraints={{
				singleRowMaxHeight: 300,
			}}
			onClick={({ index }) => onPhotoClick(index)}
			render={{ photo: renderCustomPhoto }}
		/>
	);
}
