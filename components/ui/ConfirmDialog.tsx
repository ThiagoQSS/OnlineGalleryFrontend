"use client";

import React from "react";
import * as Icon from "lucide-react";

interface ConfirmDialogProps {
	isOpen: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	isDestructive?: boolean;
	loading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmDialog({
	isOpen,
	title,
	message,
	confirmText = "Confirmar",
	cancelText = "Cancelar",
	isDestructive = false,
	loading = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	if (!isOpen) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
			onClick={() => !loading && onCancel()}
		>
			<div
				className="bg-surface1 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4 text-foreground"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center gap-3">
					<div
						className={`p-2.5 rounded-2xl ${
							isDestructive ? "bg-red-500/20 text-red-400" : "bg-selected-surface text-selected-surface2"
						}`}
					>
						{isDestructive ? (
							<Icon.AlertTriangle className="w-5 h-5" />
						) : (
							<Icon.HelpCircle className="w-5 h-5" />
						)}
					</div>
					<h3 className="text-base font-bold">{title}</h3>
				</div>

				<p className="text-xs text-foreground2 leading-relaxed">{message}</p>

				<div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
					<button
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="px-4 py-2 rounded-full text-xs font-semibold hover:bg-white/10 text-foreground2 hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
					>
						{cancelText}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer ${
							isDestructive
								? "bg-red-500 hover:bg-red-600 text-white"
								: "bg-selected-surface text-selected-surface2 hover:opacity-90"
						}`}
					>
						{loading && <Icon.Loader2 className="w-3.5 h-3.5 animate-spin" />}
						<span>{confirmText}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
