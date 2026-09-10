"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import * as Icon from "lucide-react";
import { useCreateAlbum } from "@/hooks/useCreateAlbum";

function CreateAlbumContent() {
	const {
		nome,
		setNome,
		userPhotos,
		selectedPhotoIds,
		loadingPhotos,
		creating,
		error,
		togglePhoto,
		createAlbum,
	} = useCreateAlbum();

	return (
		<div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
			{/* Barra Superior */}
			<div className="flex items-center gap-3 pb-3 border-b border-surface1/60">
				<Link
					href="/albums"
					className="p-2 rounded-full hover:bg-surface1 text-foreground2 hover:text-foreground transition-colors"
					title="Voltar para álbuns"
				>
					<Icon.ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h2 className="text-2xl font-bold tracking-tight text-foreground">Novo Álbum</h2>
					<p className="text-xs text-foreground2 mt-0.5">
						Defina um título e escolha as fotos que farão parte do álbum
					</p>
				</div>
			</div>

			{/* Mensagem de Erro */}
			{error && (
				<div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
					<Icon.AlertCircle className="w-4 h-4 flex-shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{/* Campo Nome do Álbum */}
			<div className="flex flex-col gap-2">
				<label htmlFor="nomeAlbum" className="text-xs font-semibold text-foreground">
					Nome do Álbum <span className="text-red-400">*</span>
				</label>
				<input
					id="nomeAlbum"
					type="text"
					placeholder="Ex: Viagem Salvador 2026, Aniversário..."
					value={nome}
					onChange={(e) => setNome(e.target.value)}
					className="w-full bg-surface1 text-foreground placeholder:text-foreground2/50 text-sm rounded-2xl px-4 py-3 border border-transparent focus:border-selected-surface2 focus:outline-none transition-all"
				/>
			</div>

			{/* Seleção de Fotos */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
							Selecione as Fotos
							<span className="text-xs px-2.5 py-0.5 rounded-full bg-surface1 text-foreground2 font-medium">
								{selectedPhotoIds.size} selecionada(s)
							</span>
						</h3>
						<p className="text-[11px] text-foreground2 mt-0.5">
							A primeira foto selecionada será utilizada como a capa inicial do álbum.
						</p>
					</div>
				</div>

				{/* Loading Fotos */}
				{loadingPhotos && (
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
						{[...Array(12)].map((_, i) => (
							<div
								key={i}
								className="aspect-square rounded-2xl bg-surface1/60 animate-pulse border border-white/5"
							/>
						))}
					</div>
				)}

				{/* Sem Fotos na Galeria */}
				{!loadingPhotos && userPhotos.length === 0 && (
					<div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-surface1/40 border border-white/5 text-center">
						<Icon.ImageIcon className="w-10 h-10 text-foreground2/50 mb-3" />
						<p className="text-sm font-medium text-foreground">Você ainda não tem fotos na galeria</p>
						<p className="text-xs text-foreground2 max-w-xs mt-1 mb-4">
							Faça upload de fotos na aba Fotos antes de criar seu álbum.
						</p>
						<Link
							href="/photos"
							className="px-4 py-2 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all"
						>
							Ir para Fotos
						</Link>
					</div>
				)}

				{/* Grid de Seleção */}
				{!loadingPhotos && userPhotos.length > 0 && (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
						{userPhotos.map((photo) => {
							const isSelected = selectedPhotoIds.has(photo.id);
							return (
								<div
									key={photo.id}
									onClick={() => togglePhoto(photo.id)}
									className={`group relative aspect-square rounded-2xl overflow-hidden bg-surface1 border cursor-pointer select-none transition-all ${
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

									{/* Badge de Seleção */}
									<div
										className={`absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
											isSelected
												? "bg-selected-surface2 text-selected-surface opacity-100 shadow-md scale-105"
												: "bg-black/50 text-white/80 border border-white/20 opacity-0 group-hover:opacity-100"
										}`}
									>
										{isSelected && <Icon.Check className="w-4 h-4 stroke-[3]" />}
									</div>

									{/* Nome da Foto no Rodapé */}
									<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
										<p className="text-[10px] text-white truncate">{photo.nome}</p>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Barra de Ações Inferior */}
			<div className="flex items-center justify-end gap-3 pt-4 border-t border-surface1/60">
				<Link
					href="/albums"
					className="px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-surface1 text-foreground2 hover:text-foreground transition-all"
				>
					Cancelar
				</Link>

				<button
					type="button"
					onClick={createAlbum}
					disabled={creating || !nome.trim() || selectedPhotoIds.size === 0}
					className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
				>
					{creating ? (
						<>
							<Icon.Loader2 className="w-4 h-4 animate-spin" />
							<span>Criando Álbum...</span>
						</>
					) : (
						<>
							<Icon.FolderPlus className="w-4 h-4" />
							<span>Criar Álbum ({selectedPhotoIds.size})</span>
						</>
					)}
				</button>
			</div>
		</div>
	);
}

export default function CreateAlbumPage() {
	return (
		<Suspense
			fallback={
				<div className="p-8 text-center text-xs text-foreground2 flex items-center justify-center gap-2">
					<Icon.Loader2 className="w-4 h-4 animate-spin" />
					<span>Carregando criação de álbum...</span>
				</div>
			}
		>
			<CreateAlbumContent />
		</Suspense>
	);
}
