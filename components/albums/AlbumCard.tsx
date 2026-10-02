"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Icon from "lucide-react";
import { AlbumResumoDTO } from "@/types/api";

interface AlbumCardProps {
	album: AlbumResumoDTO;
	isShared?: boolean;
	onDownload: (id: number, nome: string) => void;
	onDelete?: (id: number) => void;
}

export default function AlbumCard({
	album,
	isShared = false,
	onDownload,
	onDelete,
}: AlbumCardProps) {
	const [imageError, setImageError] = useState(false);

	const getCapaUrl = (url: string | null): string | null => {
		if (!url) return null;
		if (url.startsWith("http://") || url.startsWith("https://")) return url;
		const baseUrl =
			process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
		return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
	};

	const resolvedCapaUrl = getCapaUrl(album.capaUrl);

	return (
		<div className="group relative rounded-3xl bg-surface1/60 border border-white/5 overflow-hidden hover:border-white/15 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer">
			<Link
				href={`/albuns/${album.id}`}
				className="block relative w-full aspect-4/3 overflow-hidden bg-surface1"
			>
				{resolvedCapaUrl && !imageError ? (
					<Image
						src={resolvedCapaUrl}
						alt={album.nome}
						fill
						unoptimized
						className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-surface1 to-background2 text-foreground2/50">
						<Icon.Album className="w-12 h-12 stroke-1" />
					</div>
				)}

				{/* Overlay gradiente no hover */}
				<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

				{/* Badge Compartilhado ou Próprio */}
				<div className="absolute top-3 left-3 z-10">
					{isShared ? (
						<span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/80 text-white backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1">
							<Icon.Users className="w-3 h-3" />
							Compartilhado
						</span>
					) : (
						<span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-black/50 text-white/90 backdrop-blur-md border border-white/10 shadow-sm">
							Meu Álbum
						</span>
					)}
				</div>
			</Link>

			{/* Rodapé do Card */}
			<div className="p-4 flex items-center justify-between gap-2">
				<Link href={`/albuns/${album.id}`} className="truncate flex-1">
					<h3 className="text-sm font-bold text-foreground truncate hover:text-selected-surface2 transition-colors">
						{album.nome}
					</h3>
				</Link>

				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDownload(album.id, album.nome);
						}}
						className="p-2 rounded-full hover:bg-white/10 text-foreground2 hover:text-foreground transition-colors cursor-pointer"
						title="Baixar álbum completo (.zip)"
					>
						<Icon.Download className="w-4 h-4" />
					</button>

					{!isShared && onDelete && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(album.id);
							}}
							className="p-2 rounded-full hover:bg-red-500/20 text-foreground2 hover:text-red-400 transition-colors cursor-pointer"
							title="Excluir álbum"
						>
							<Icon.Trash2 className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
