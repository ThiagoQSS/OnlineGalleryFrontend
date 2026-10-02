"use client";

import {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

import { useQueryClient } from "@tanstack/react-query";

export interface User {
	id: number;
	nome: string;
	email: string;
}

interface AuthContextData {
	user: User | null;
	login: (userData: User) => void;
	logout: () => Promise<void>;
	loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const router = useRouter();
	const queryClient = useQueryClient();

	useEffect(() => {
		async function checkAuth() {
			try {
				// Chama a API que valida o cookie HttpOnly e retorna o usuário atual
				const response = await api.get<User>("/auth/me");
				setUser(response.data);
			} catch (error) {
				// Cookie expirado ou inválido
				setUser(null);
			} finally {
				setLoading(false);
			}
		}

		checkAuth();
	}, []);

	const login = (userData: User) => {
		queryClient.clear();
		setUser(userData);
		router.push("/photos");
	};

	const logout = async () => {
		try {
			await api.post("/auth/logout");
		} catch (error) {
			console.error("Erro ao fazer logout:", error);
		} finally {
			queryClient.clear();
			setUser(null);
			router.push("/login");
			console.log("Usuário deslogado com sucesso.");
		}
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
