"use client";

import React from "react";
import * as Icon from "lucide-react";

interface PhotoBatchBarProps {
	selectedCount: number;
	totalCount: number;
	onSelectAll: () => void;
	onClearSelection: () => void;
	onDownloadSelected: () => void;
	onDeleteSelected: () => void;
	onAddToAlbum?: () => void;
	isDeleting?: boolean;
}

export default function PhotoBatchBar({
	selectedCount,
	totalCount,
	onSelectAll,
	onClearSelection,
	onDownloadSelected,
	onDeleteSelected,
	onAddToAlbum,
	isDeleting = false,
}: PhotoBatchBarProps) {
	if (selectedCount === 0) return null;

	const allSelected = selectedCount === totalCount && totalCount > 0;

	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface1/95 backdrop-blur-md border border-white/10 px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 text-foreground animate-in slide-in-from-bottom-5 fade-in duration-200">
			{/* Contador */}
			<div className="flex items-center gap-2 pr-3 border-r border-white/10">
				<div className="w-6 h-6 rounded-full bg-selected-surface text-selected-surface2 flex items-center justify-center text-xs font-bold">
					{selectedCount}
				</div>
				<span className="text-xs font-medium hidden sm:inline">
					{selectedCount === 1 ? "foto selecionada" : "fotos selecionadas"}
				</span>
			</div>

			{/* Alternar seleção de todas */}
			<button
				type="button"
				onClick={allSelected ? onClearSelection : onSelectAll}
				className="text-xs text-foreground2 hover:text-foreground font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
			>
				{allSelected ? "Desmarcar todas" : "Selecionar todas"}
			</button>

			{/* Ações */}
			<div className="flex items-center gap-2">
				{onAddToAlbum && (
					<button
						type="button"
						onClick={onAddToAlbum}
						className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface1 hover:bg-white/10 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
						title="Adicionar fotos a um álbum"
					>
						<Icon.FolderPlus className="w-3.5 h-3.5 text-selected-surface2" />
						<span className="hidden md:inline">Álbum</span>
					</button>
				)}

				<button
					type="button"
					onClick={onDownloadSelected}
					className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface1 hover:bg-white/10 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
					title="Baixar fotos selecionadas em arquivo .zip"
				>
					<Icon.Download className="w-3.5 h-3.5" />
					<span className="hidden md:inline">Baixar (.zip)</span>
				</button>

				<button
					type="button"
					onClick={onDeleteSelected}
					disabled={isDeleting}
					className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium border border-red-500/30 transition-colors disabled:opacity-50 cursor-pointer"
					title="Excluir fotos selecionadas"
				>
					<Icon.Trash2 className="w-3.5 h-3.5" />
					<span className="hidden md:inline">Excluir</span>
				</button>
			</div>

			{/* Botão de Fechar seleção */}
			<button
				type="button"
				onClick={onClearSelection}
				className="p-1 rounded-full text-foreground2 hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer ml-1"
				title="Cancelar seleção"
			>
				<Icon.X className="w-4 h-4" />
			</button>
		</div>
	);
}
