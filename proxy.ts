import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
	if (_request.nextUrl.pathname === "/") {
		return NextResponse.redirect(new URL("/photos", _request.url));
	}

	return NextResponse.next();
}

// Configuração para dizer ao Next.js em quais rotas o middleware deve rodar
export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
