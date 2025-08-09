import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Skip middleware for public routes to prevent loops
    if (pathname.startsWith('/sign-in') || 
        pathname.startsWith('/sign-up') || 
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/access-denied') ||
        pathname === '/' ||
        pathname.startsWith('/s/') ||
        pathname.startsWith('/p/')) {
      return NextResponse.next();
    }

    // Check if user is inactive (but skip for access-denied page)
    if (token && !token.isActive && pathname !== '/access-denied') {
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }

    // Check if trying to access admin routes
    if (pathname.startsWith('/admin')) {
      if (!token?.isSuper) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow public routes - ALWAYS allow these without any checks
        if (pathname.startsWith('/sign-in') || 
            pathname.startsWith('/sign-up') || 
            pathname.startsWith('/api/auth') ||
            pathname.startsWith('/access-denied') ||
            pathname === '/' ||
            pathname.startsWith('/s/') ||
            pathname.startsWith('/p/')) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/sign-in',
      error: '/access-denied'
    }
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - fonts folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/|fonts/|access-denied).*)',
  ],
};