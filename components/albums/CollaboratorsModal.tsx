"use client";

import React, { useState } from "react";
import * as Icon from "lucide-react";
import { UsuarioDTO } from "@/types/api";

interface CollaboratorsModalProps {
	isOpen: boolean;
	onClose: () => void;
	criador: UsuarioDTO;
	convidados: UsuarioDTO[];
	isCreator: boolean;
	onInvite: (email: string) => Promise<void>;
	onKick: (email: string) => Promise<void>;
}

export default function CollaboratorsModal({
	isOpen,
	onClose,
	criador,
	convidados,
	isCreator,
	onInvite,
	onKick,
}: CollaboratorsModalProps) {
	const [email, setEmail] = useState("");
	const [loadingInvite, setLoadingInvite] = useState(false);
	const [kickingEmail, setKickingEmail] = useState<string | null>(null);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	if (!isOpen) return null;

	const handleInviteSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!email.trim()) return;

		setLoadingInvite(true);
		setMessage(null);

		try {
			await onInvite(email.trim());
			setMessage({
				type: "success",
				text: `Convite enviado com sucesso para ${email.trim()}! O destinatário receberá um e-mail com o link de acesso.`,
			});
			setEmail("");
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { error?: string } };
			};
			setMessage({
				type: "error",
				text:
					errorObj.response?.data?.error ||
					"Erro ao enviar convite. Verifique o e-mail digitado.",
			});
		} finally {
			setLoadingInvite(false);
		}
	};

	const handleKick = async (userEmail: string) => {
		setKickingEmail(userEmail);
		setMessage(null);
		try {
			await onKick(userEmail);
			setMessage({
				type: "success",
				text: `Colaborador ${userEmail} removido com sucesso.`,
			});
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { error?: string } };
			};
			setMessage({
				type: "error",
				text:
					errorObj.response?.data?.error ||
					"Erro ao remover colaborador.",
			});
		} finally {
			setKickingEmail(null);
		}
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
			onClick={onClose}
		>
			<div
				className="bg-surface1 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-5 text-foreground relative"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between pb-3 border-b border-white/10">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-selected-surface text-selected-surface2">
							<Icon.Users className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-base font-bold">
								Colaboradores do Álbum
							</h3>
							<p className="text-xs text-foreground2">
								Pessoas que têm acesso a visualizar e adicionar
								fotos
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-full hover:bg-white/10 text-foreground2 hover:text-foreground transition-colors cursor-pointer"
					>
						<Icon.X className="w-5 h-5" />
					</button>
				</div>

				{/* Mensagem de Feedback */}
				{message && (
					<div
						className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
							message.type === "success"
								? "bg-green-500/15 border-green-500/30 text-green-300"
								: "bg-red-500/15 border-red-500/30 text-red-300"
						}`}
					>
						{message.type === "success" ? (
							<Icon.CheckCircle2 className="w-4 h-4 flex-shrink-0" />
						) : (
							<Icon.AlertCircle className="w-4 h-4 flex-shrink-0" />
						)}
						<span>{message.text}</span>
					</div>
				)}

				{/* Formulário de Envio de Convite (somente criador) */}
				{isCreator && (
					<form
						onSubmit={handleInviteSubmit}
						className="flex flex-col gap-2"
					>
						<label
							htmlFor="inviteEmail"
							className="text-xs font-semibold text-foreground"
						>
							Convidar novo colaborador por e-mail
						</label>
						<p className="text-[10px] text-foreground2 mb-1">
							O usuário receberá um convite para acessar e colaborar neste álbum.
						</p>
						<div className="flex items-center gap-2">
							<div className="relative flex-1">
								<Icon.Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground2" />
								<input
									id="inviteEmail"
									type="email"
									required
									placeholder="colaborador@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full bg-background2/60 text-foreground placeholder:text-foreground2/50 text-xs rounded-full pl-9 pr-4 py-2.5 border border-white/10 focus:border-selected-surface2 focus:outline-none transition-all"
								/>
							</div>
							<button
								type="submit"
								disabled={loadingInvite || !email.trim()}
								className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
							>
								{loadingInvite ? (
									<Icon.Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Icon.Send className="w-3.5 h-3.5" />
								)}
								<span>Convidar</span>
							</button>
						</div>
					</form>
				)}

				{/* Lista de Membros */}
				<div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
					<span className="text-xs font-semibold text-foreground2 uppercase tracking-wider">
						Membros ({1 + convidados.length})
					</span>

					{/* Criador */}
					<div className="flex items-center justify-between p-2.5 rounded-2xl bg-background2/50 border border-white/5">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-selected-surface text-selected-surface2 flex items-center justify-center font-bold text-xs">
								{criador?.nome
									? criador.nome.charAt(0).toUpperCase()
									: "C"}
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-semibold text-foreground">
									{criador?.nome} (Criador)
								</span>
								<span className="text-[11px] text-foreground2">
									{criador?.email}
								</span>
							</div>
						</div>
						<span className="text-[10px] px-2 py-0.5 rounded-full bg-selected-surface/50 text-selected-surface2 font-medium">
							Dono
						</span>
					</div>

					{/* Convidados */}
					{convidados.map((user) => (
						<div
							key={user.id}
							className="flex items-center justify-between p-2.5 rounded-2xl bg-background2/30 border border-white/5"
						>
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 rounded-full bg-surface1 text-foreground flex items-center justify-center font-bold text-xs">
									{user?.nome
										? user.nome.charAt(0).toUpperCase()
										: "U"}
								</div>
								<div className="flex flex-col">
									<span className="text-xs font-semibold text-foreground">
										{user?.nome}
									</span>
									<span className="text-[11px] text-foreground2">
										{user?.email}
									</span>
								</div>
							</div>

							{isCreator && (
								<button
									type="button"
									onClick={() => handleKick(user.email)}
									disabled={kickingEmail === user.email}
									className="p-1.5 rounded-full hover:bg-red-500/20 text-foreground2 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
									title="Remover colaborador do álbum"
								>
									{kickingEmail === user.email ? (
										<Icon.Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : (
										<Icon.UserX className="w-3.5 h-3.5" />
									)}
								</button>
							)}
						</div>
					))}

					{convidados.length === 0 && (
						<p className="text-xs text-foreground2/70 text-center py-3">
							Nenhum outro colaborador convidado ainda.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
