import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			// Configuração para a API Spring Boot / Gateway Local
			{
				protocol: "http",
				hostname: "localhost",
				port: "8080",
				pathname: "/file-management-ms/**",
			},
			// Configuração para o Bucket S3 / MinIO
			{
				protocol: "http",
				hostname: "localhost",
				port: "9000",
				pathname: "/**",
			},
		],
		dangerouslyAllowLocalIP: true,
		qualities: [75, 85, 100],
	},
};

export default nextConfig;
