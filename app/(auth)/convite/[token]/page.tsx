"use client";

import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as Icon from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export default function InvitePage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const { user } = useAuth();

	// Obtém o token a partir da rota [token] ou query param ?token=
	const token = (params?.token as string) || searchParams.get("token") || "";

	const [coverError, setCoverError] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);

	const apiBaseUrl = api.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
	const coverUrl = token ? `${apiBaseUrl}/arquivos/public/download?token=${token}` : "";

	const tokenError = !token
		? "Código de convite não encontrado na URL."
		: apiError;

	return (
		<div className="min-h-screen bg-background2 flex flex-col items-center justify-center p-4 sm:p-6 text-foreground">
			<div className="w-full max-w-md bg-surface1 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col items-center text-center gap-6">
				{/* Logo / Ícone */}
				<div className="flex items-center gap-2">
					<div className="w-10 h-10 rounded-2xl bg-selected-surface text-selected-surface2 flex items-center justify-center font-bold">
						<Icon.Images className="w-5 h-5" />
					</div>
					<span className="text-xl font-bold tracking-tight">Online Gallery</span>
				</div>

				{/* Imagem de Capa do Álbum Convidado */}
				{token && !tokenError && (
					<div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-background2/60 border border-white/10 shadow-md">
						{!coverError ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={coverUrl}
								alt="Capa do Álbum Convidado"
								className="w-full h-full object-cover"
								onError={() => {
									setCoverError(true);
									setApiError("Não foi possível carregar a capa. O convite pode ter expirado ou já ter sido utilizado.");
								}}
							/>
						) : (
							<div className="w-full h-full flex flex-col items-center justify-center text-foreground2/60 gap-2 p-4">
								<Icon.ImageOff className="w-10 h-10 opacity-50" />
								<span className="text-xs">Capa indisponível ou expirada</span>
							</div>
						)}
					</div>
				)}

				{/* Conteúdo textual */}
				<div className="flex flex-col gap-2">
					<h2 className="text-xl font-bold tracking-tight">
						{tokenError ? "Convite Indisponível" : "Você foi convidado!"}
					</h2>
					<p className="text-xs text-foreground2 leading-relaxed">
						{tokenError
							? tokenError
							: "Você foi convidado para colaborar em um álbum compartilhado. Acesse sua conta para começar a visualizar e adicionar fotos."}
					</p>
				</div>

				{/* Ações */}
				<div className="w-full flex flex-col gap-3 pt-2">
					{user ? (
						<Link
							href="/albums"
							className="w-full py-3 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
						>
							<Icon.FolderCheck className="w-4 h-4" />
							<span>Ver Álbuns Compartilhados</span>
						</Link>
					) : (
						<>
							<Link
								href="/login"
								className="w-full py-3 rounded-full bg-selected-surface text-selected-surface2 text-xs font-semibold hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
							>
								<Icon.LogIn className="w-4 h-4" />
								<span>Fazer Login para Acessar</span>
							</Link>

							<Link
								href="/login"
								className="w-full py-3 rounded-full bg-surface1/60 hover:bg-white/10 text-foreground text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-2"
							>
								<span>Ainda não tem conta? Cadastre-se</span>
							</Link>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
