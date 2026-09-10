"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { AxiosError } from "axios";

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
					err.response?.data?.message ||
						"Erro ao fazer login. Tente novamente.",
				);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
				<div className="text-center">
					<h2 className="text-3xl font-bold tracking-tight text-gray-900">
						Online Gallery
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						Faça login para gerenciar seus álbuns
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleLogin}>
					{error && (
						<div className="rounded bg-red-50 p-4 text-sm text-red-500">
							{error}
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700"
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-black focus:outline-none text-stone-950"
							/>
						</div>
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								Senha
							</label>
							<input
								id="password"
								type="password"
								required
								value={senha}
								onChange={(e) => setSenha(e.target.value)}
								className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-black focus:outline-none text-stone-950"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
					>
						{loading ? "Entrando..." : "Entrar"}
					</button>
				</form>
			</div>
		</div>
	);
}
