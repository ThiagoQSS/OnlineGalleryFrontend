"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/services/api";
import { AxiosError } from "axios";
import bgImage from "@/assets/collage.jpg";

export default function RegisterPage() {
	const [nome, setNome] = useState("");
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [confirmarSenha, setConfirmarSenha] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccessMessage("");

		// Validação simples antes de chamar a API
		if (senha !== confirmarSenha) {
			setError("As senhas não coincidem.");
			setLoading(false);
			return;
		}

		try {
			await api.post("/auth/cadastro", {
				nome,
				email,
				senha,
			});

			setSuccessMessage(
				"Conta criada com sucesso! Você já pode fazer login.",
			);
			// Limpa o formulário
			setNome("");
			setEmail("");
			setSenha("");
			setConfirmarSenha("");
		} catch (err) {
			if (!(err instanceof AxiosError)) {
				setError("Erro desconhecido. Tente novamente.");
			} else {
				setError(
					err.response?.data?.error ||
						"Erro ao criar conta. Tente novamente.",
				);
			}
			console.log("Erro ao registrar usuário:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden py-10">
			{/* 1. Imagem de Plano de Fundo */}
			<Image
				src={bgImage}
				alt="Background Online Gallery"
				fill
				priority
				quality={85}
				className="object-cover object-center"
			/>

			{/* 2. Camada de Escurecimento (Overlay) */}
			<div className="absolute inset-0 bg-black/60" />

			{/* 3. Card do Formulário */}
			<div className="relative z-10 w-full max-w-md space-y-6 rounded-xl p-10">
				<div className="text-center">
					<h2 className="text-3xl font-bold tracking-tight text-white">
						Criar Conta
					</h2>
					<p className="mt-2 text-sm text-white">
						Cadastre-se para começar a enviar suas fotos
					</p>
				</div>

				<form className="mt-6 space-y-4" onSubmit={handleRegister}>
					{error && (
						<div className="rounded bg-red-50 p-3 text-sm text-red-500">
							{error}
						</div>
					)}

					{successMessage && (
						<div className="rounded bg-emerald-50 p-3 text-sm text-emerald-600">
							{successMessage}
						</div>
					)}

					<div>
						<label
							htmlFor="nome"
							className="block text-sm font-medium text-white"
						>
							Nome Completo
						</label>
						<input
							id="nome"
							type="text"
							required
							value={nome}
							onChange={(e) => setNome(e.target.value)}
							className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-white focus:border-gray-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-white"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-white focus:border-gray-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-white"
						>
							Senha
						</label>
						<input
							id="password"
							type="password"
							autoComplete="new-password"
							required
							value={senha}
							onChange={(e) => setSenha(e.target.value)}
							className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-white focus:border-gray-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="confirmarSenha"
							className="block text-sm font-medium text-white"
						>
							Confirmar Senha
						</label>
						<input
							id="confirmarSenha"
							type="password"
							autoComplete="new-password"
							required
							value={confirmarSenha}
							onChange={(e) => setConfirmarSenha(e.target.value)}
							className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-white focus:border-gray-500 focus:outline-none"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="flex w-full justify-center rounded-md bg-indigo-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 cursor-pointer transition-all"
					>
						{loading ? "Cadastrando..." : "Criar conta"}
					</button>
				</form>

				{/* Link para voltar ao Login */}
				<div className="text-center text-sm text-white">
					Já possui uma conta?{" "}
					<Link
						href="/login"
						className="font-semibold text-blue-600 hover:underline"
					>
						Entrar
					</Link>
				</div>
			</div>
		</div>
	);
}
