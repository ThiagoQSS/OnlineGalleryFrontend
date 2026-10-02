"use client";

import { api } from "@/services/api";
import { AxiosError } from "axios";
import * as Icon from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function ConviteContent() {
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState<string | null>(null);
	const router = useRouter();

	const params = useSearchParams();
	const tokenConvite = params.get("token");

	useEffect(() => {
		// Se o token não for encontrado na URL, encerra o carregamento e exibe erro
		if (!tokenConvite) {
			setMessage("Token de convite inválido ou ausente.");
			setLoading(false);
			return;
		}

		const aceitarConvite = async () => {
			setLoading(true);
			try {
				const response = await api.post(
					`/albuns/accept/${tokenConvite}`,
				);
				setMessage(
					"Convite aceito com sucesso! Redirecionando...\nOu clique em Álbuns para ver seus álbuns",
				);
				if (response.data) router.push(`/albuns/${response.data}`);
			} catch (error) {
				if (error instanceof AxiosError) {
					setMessage(
						error.response?.data?.error ||
							"Erro ao aceitar convite",
					);
				} else {
					setMessage("Erro ao aceitar convite");
				}
			} finally {
				setLoading(false);
			}
		};

		aceitarConvite();
	}, [tokenConvite, router]);

	if (loading) {
		return (
			<div className="min-h-screen bg-background2 flex items-center justify-center text-xs text-foreground2 gap-2">
				<Icon.Loader2 className="w-4 h-4 animate-spin" />
				<span>Carregando convite...</span>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background2 flex items-center justify-center text-xs text-foreground2 gap-2">
			{message && (
				<>
					<Icon.AlertCircle className="w-4 h-4" />
					<span>{message}</span>
				</>
			)}
		</div>
	);
}

export default function ConvitePage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-background2 flex items-center justify-center text-xs text-foreground2 gap-2">
					<Icon.Loader2 className="w-4 h-4 animate-spin" />
					<span>Carregando convite...</span>
				</div>
			}
		>
			<ConviteContent />
		</Suspense>
	);
}
