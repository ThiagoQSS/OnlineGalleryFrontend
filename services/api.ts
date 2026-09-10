import axios from "axios";

export const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

api.interceptors.response.use(
	(response) => {
		// Retorna a resposta normal se deu tudo certo (2xx)
		return response;
	},
	(error) => {
		// Se a API não respondeu ou deu erro de rede
		if (!error.response) {
			return Promise.reject(error);
		}

		const { status, config } = error.response;

		// Evita loop infinito de redirecionamento se o erro 401/403 acontecer na própria tela de Login
		const isAuthRoute = config.url?.includes("/auth/login");

		if ((status === 401 || status === 403) && !isAuthRoute) {
			if (typeof window !== "undefined") {
				// Redireciona o usuário para o login limpando a pilha de navegação
				window.location.href = "/login?sessionExpired=true";
			}
		}

		return Promise.reject(error);
	},
);
