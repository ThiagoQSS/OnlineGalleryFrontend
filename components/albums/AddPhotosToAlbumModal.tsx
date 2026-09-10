"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import * as Icon from "lucide-react";
import { ArquivoResponseDTO } from "@/types/api";
import { photoService } from "@/services/photoService";

interface AddPhotosToAlbumModalProps {
	isOpen: boolean;
	onClose: () => void;
	existingPhotoIds: number[];
	onAddPhotos: (photoIds: number[]) => Promise<void>;
}

export default function AddPhotosToAlbumModal({
	isOpen,
	onClose,
	existingPhotoIds,
	onAddPhotos,
}: AddPhotosToAlbumModalProps) {
	const [userPhotos, setUserPhotos] = useState<ArquivoResponseDTO[]>([]);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen) return;

		let isMounted = true;

		photoService
			.getPhotos()
			.then((photos) => {
				if (!isMounted) return;
				// Filtra apenas fotos que ainda NÃO estão neste álbum
				const existingSet = new Set(existingPhotoIds);
				const available = photos.filter((p) => !existingSet.has(p.id));
				setUserPhotos(available);
				setSelectedIds(new Set());
				setError(null);
				setLoading(false);
			})
			.catch((err) => {
				if (!isMounted) return;
				console.error("Erro ao carregar fotos:", err);
				setError("Erro ao carregar fotos da galeria.");
				setLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [isOpen, existingPhotoIds]);

	if (!isOpen) return null;

	const togglePhoto = (id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleSubmit = async () => {
		if (selectedIds.size === 0) return;
		setSubmitting(true);
		setError(null);
		try {
			await onAddPhotos(Array.from(selectedIds));
			onClose();
		} catch (err: unknown) {
			const errorObj = err as { response?: { data?: { error?: string } } };
			setError(errorObj.response?.data?.error || "Erro ao adicionar fotos ao álbum.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
			onClick={() => !submitting && onClose()}
		>
			<div
				className="bg-surface1 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4 text-foreground relative max-h-[85vh]"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between pb-3 border-b border-white/10">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-selected-surface text-selected-surface2">
							<Icon.ImagePlus className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-base font-bold">Adicionar Fotos ao Álbum</h3>
							<p className="text-xs text-foreground2">
								Selecione fotos da sua galeria para incluir neste álbum
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={submitting}
						className="p-1.5 rounded-full hover:bg-white/10 text-foreground2 hover:text-foreground transition-colors cursor-pointer"
					>
						<Icon.X className="w-5 h-5" />
					</button>
				</div>

				{/* Erro */}
				{error && (
					<div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
						<Icon.AlertCircle className="w-4 h-4 flex-shrink-0" />
						<span>{error}</span>
					</div>
				)}

				{/* Conteúdo com Scroll */}
				<div className="flex-1 overflow-y-auto pr-1 min-h-[220px]">
					{loading && (
						<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
							{[...Array(10)].map((_, i) => (
								<div
									key={i}
									className="aspect-square rounded-2xl bg-surface1/60 animate-pulse border border-white/5"
								/>
							))}
						</div>
					)}

					{!loading && userPhotos.length === 0 && (
						<div className="flex flex-col items-center justify-center p-10 text-center text-foreground2">
							<Icon.CheckCircle2 className="w-10 h-10 text-selected-surface2 mb-2 opacity-80" />
							<p className="text-sm font-medium text-foreground">Todas as suas fotos já estão no álbum</p>
							<p className="text-xs text-foreground2 max-w-xs mt-1">
								Envie mais fotos na sua galeria para poder adicioná-las aqui.
							</p>
						</div>
					)}

					{!loading && userPhotos.length > 0 && (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
							{userPhotos.map((photo) => {
								const isSelected = selectedIds.has(photo.id);
								return (
									<div
										key={photo.id}
										onClick={() => togglePhoto(photo.id)}
										className={`group relative aspect-square rounded-2xl overflow-hidden bg-background2/60 border cursor-pointer select-none transition-all ${
											isSelected
												? "border-selected-surface2 ring-2 ring-selected-surface2 shadow-md"
												: "border-white/5 hover:border-white/20"
										}`}
									>
										<Image
											src={photo.url}
											alt={photo.nome}
											fill
											unoptimized
											className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
										/>

										<div
											className={`absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
												isSelected
													? "bg-selected-surface2 text-selected-surface opacity-100 shadow-md scale-105"
													: "bg-black/50 text-white/80 border border-white/20 opacity-0 group-hover:opacity-100"
											}`}
										>
											{isSelected && <Icon.Check className="w-4 h-4 stroke-[3]" />}
										</div>

										<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
											<p className="text-[10px] text-white truncate">{photo.nome}</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between pt-3 border-t border-white/10">
					<span className="text-xs text-foreground2 font-medium">
						{selectedIds.size} foto(s) selecionada(s)
					</span>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={onClose}
							disabled={submitting}
							className="px-4 py-2 rounded-full text-xs font-semibold hover:bg-white/10 text-foreground2 hover:text-foreground transition-all"
						>
							Cancelar
						</button>

						<button
							type="button"
							onClick={handleSubmit}
							disabled={submitting || selectedIds.size === 0}
							className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
						>
							{submitting ? (
								<>
									<Icon.Loader2 className="w-4 h-4 animate-spin" />
									<span>Adicionando...</span>
								</>
							) : (
								<>
									<Icon.Plus className="w-4 h-4" />
									<span>Adicionar ({selectedIds.size})</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
