"use client";

import React, { useState, useRef } from "react";
import * as Icon from "lucide-react";

interface PhotoUploadModalProps {
	isOpen: boolean;
	onClose: () => void;
	onUpload: (files: File[]) => Promise<boolean | void>;
	uploading: boolean;
	uploadProgress: number;
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function PhotoUploadModal({
	isOpen,
	onClose,
	onUpload,
	uploading,
	uploadProgress,
}: PhotoUploadModalProps) {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [dragOver, setDragOver] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	if (!isOpen) return null;

	const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
		setErrorMessage(null);
		const validFiles: File[] = [];
		const invalidNames: string[] = [];

		Array.from(incomingFiles).forEach((file) => {
			const lowerName = file.name.toLowerCase();
			const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
			const hasValidSize = file.size <= MAX_FILE_SIZE;

			if (hasValidExt && hasValidSize) {
				validFiles.push(file);
			} else {
				invalidNames.push(file.name);
			}
		});

		if (invalidNames.length > 0) {
			setErrorMessage(
				`Alguns arquivos não foram adicionados por estarem fora do formato (.jpg, .png, .webp) ou excederem 10MB: ${invalidNames.slice(0, 3).join(", ")}${invalidNames.length > 3 ? "..." : ""}`,
			);
		}

		if (validFiles.length > 0) {
			setSelectedFiles((prev) => [...prev, ...validFiles]);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			validateAndAddFiles(e.target.files);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			validateAndAddFiles(e.dataTransfer.files);
		}
	};

	const removeFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleConfirmUpload = async () => {
		if (selectedFiles.length === 0) return;
		try {
			await onUpload(selectedFiles);
			setSelectedFiles([]);
			setErrorMessage(null);
			onClose();
		} catch (err: unknown) {
			const error = err as { response?: { data?: { error?: string } } };
			setErrorMessage(error.response?.data?.error || "Erro ao realizar upload das fotos.");
		}
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
			onClick={() => !uploading && onClose()}
		>
			<div
				className="bg-surface1 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-5 text-foreground relative"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-selected-surface text-selected-surface2">
							<Icon.UploadCloud className="w-5 h-5" />
						</div>
						<h3 className="text-lg font-bold">Upload de Imagens</h3>
					</div>
					<button
						onClick={onClose}
						disabled={uploading}
						className="p-1.5 rounded-full hover:bg-white/10 text-foreground2 hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
					>
						<Icon.X className="w-5 h-5" />
					</button>
				</div>

				{/* Drag & Drop Area */}
				<div
					onDragOver={(e) => {
						e.preventDefault();
						setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={handleDrop}
					onClick={() => fileInputRef.current?.click()}
					className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
						dragOver
							? "border-selected-surface2 bg-selected-surface/20"
							: "border-white/15 hover:border-white/30 bg-background2/50"
					}`}
				>
					<Icon.ImagePlus className="w-10 h-10 text-foreground2 opacity-60" />
					<p className="text-sm font-medium text-center">
						Arraste suas fotos aqui ou <span className="text-selected-surface2 underline">procure no computador</span>
					</p>
					<p className="text-[11px] text-foreground2/70 text-center">
						Formatos aceitos: JPG, PNG, WEBP (Máximo 10MB por foto)
					</p>
					<input
						type="file"
						ref={fileInputRef}
						onChange={handleFileSelect}
						multiple
						accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
						className="hidden"
					/>
				</div>

				{/* Error Message */}
				{errorMessage && (
					<div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
						<Icon.AlertCircle className="w-4 h-4 flex-shrink-0" />
						<span>{errorMessage}</span>
					</div>
				)}

				{/* List of files queued */}
				{selectedFiles.length > 0 && (
					<div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
						<div className="flex items-center justify-between text-xs text-foreground2 font-semibold px-1">
							<span>{selectedFiles.length} foto(s) selecionada(s)</span>
							<button
								type="button"
								onClick={() => setSelectedFiles([])}
								className="text-red-400 hover:underline cursor-pointer"
								disabled={uploading}
							>
								Limpar tudo
							</button>
						</div>
						<div className="grid grid-cols-1 gap-1.5">
							{selectedFiles.map((file, i) => (
								<div
									key={i}
									className="flex items-center justify-between p-2 rounded-xl bg-background2/60 border border-white/5 text-xs"
								>
									<div className="flex items-center gap-2 truncate">
										<Icon.ImageIcon className="w-4 h-4 text-foreground2 flex-shrink-0" />
										<span className="truncate max-w-[280px]">{file.name}</span>
										<span className="text-[10px] text-foreground2 flex-shrink-0">
											({(file.size / (1024 * 1024)).toFixed(2)} MB)
										</span>
									</div>
									<button
										type="button"
										onClick={() => removeFile(i)}
										disabled={uploading}
										className="p-1 rounded-md hover:bg-white/10 text-foreground2 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
									>
										<Icon.Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Upload Progress Bar */}
				{uploading && (
					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between text-xs text-foreground2 font-medium">
							<span>Enviando fotos...</span>
							<span>{uploadProgress}%</span>
						</div>
						<div className="w-full bg-background2 rounded-full h-2 overflow-hidden border border-white/5">
							<div
								className="bg-selected-surface2 h-full transition-all duration-200"
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
					<button
						type="button"
						onClick={onClose}
						disabled={uploading}
						className="px-4 py-2 rounded-full text-xs font-semibold hover:bg-white/10 text-foreground2 hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleConfirmUpload}
						disabled={uploading || selectedFiles.length === 0}
						className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
					>
						{uploading ? (
							<>
								<Icon.Loader2 className="w-4 h-4 animate-spin" />
								<span>Enviando ({uploadProgress}%)</span>
							</>
						) : (
							<>
								<Icon.UploadCloud className="w-4 h-4" />
								<span>Enviar {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
