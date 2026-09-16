"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

export interface User {
	id: number;
	nome: string;
	email: string;
}

interface AuthContextData {
	user: User | null;
	login: (userData: User) => void;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const router = useRouter();

	const login = (userData: User) => {
		setUser(userData);
		router.push("/photos");
	};

	const logout = async () => {
		try {
			await api.post("/auth/logout");
		} catch (error) {
			console.error("Erro ao fazer logout:", error);
		} finally {
			setUser(null);
			router.push("/login");
			console.log("Usuário deslogado com sucesso.");
		}
	};

	return (
		<AuthContext.Provider value={{ user, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
