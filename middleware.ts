import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('gallery_token')?.value;
  
  // Rotas que não exigem login
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/cadastro');

  // Se tentar acessar uma rota protegida (como a raiz ou os álbuns) sem token
  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se já tem token e tenta acessar a tela de login, joga pro dashboard
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configuração para dizer ao Next.js em quais rotas o middleware deve rodar
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};