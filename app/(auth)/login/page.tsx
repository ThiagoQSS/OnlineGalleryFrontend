"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import bgImage from "@/assets/gemini_image.jpg";
import { AxiosError } from "axios";
import Image from "next/image";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const { login } = useAuth();

	const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await api.post("/auth/login", { email, senha });
			const userData = response.data.usuario || response.data.user;
			login(userData);
		} catch (err) {
			if (!(err instanceof AxiosError))
				setError("Erro desconhecido. Tente novamente.");
			else
				setError(
					err.response?.data?.error ||
						"Erro ao fazer login. Tente novamente.",
				);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center bg-gray-50">
			<Image
				src={bgImage}
				alt="Background Online Gallery"
				fill
				priority
				quality={100}
				className="object-cover object-center"
			/>

			<div className="absolute inset-0 bg-black/60" />

			<div className="w-full max-w-lg z-10 space-y-8 rounded-xl p-10">
				<div className="text-center">
					<h2 className="text-6xl font-bold tracking-tight text-white">
						Online Gallery
					</h2>
					<p className="mt-2 text-sm text-white">
						Faça login para guardar e compartilhar fotos e álbuns
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleLogin}>
					{error && (
						<div className="rounded bg-red-100 p-4 text-sm text-red-500">
							{error}
						</div>
					)}

					<div className="space-y-4">
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
								className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-300 focus:outline-none text-taupe-50 placeholder-amber-50"
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
								autoComplete="current-password"
								required
								value={senha}
								onChange={(e) => setSenha(e.target.value)}
								className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-300 focus:outline-none text-taupe-50 placeholder-amber-50"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="flex w-full justify-center rounded-md bg-indigo-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
					>
						{loading ? "Entrando..." : "Entrar"}
					</button>

					<p className="mt-2 text-sm text-center text-white">
						Não possui uma conta?{" "}
						<a
							href="/signin"
							className="text-blue-600 hover:text-indigo-500"
						>
							Cadastre-se
						</a>
					</p>
				</form>
			</div>
		</div>
	);
}
