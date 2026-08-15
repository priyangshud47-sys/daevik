import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'admin.daevik.in';
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'daevik.in';
  
  const isLoggedIn = !!req.auth;
  
  // Is this an admin route? (Either on the admin domain, or starts with /admin)
  const isAdminPath = url.pathname.startsWith('/admin');
  const isLoginPage = url.pathname === '/login' || url.pathname === '/admin/login';

  // Protect Admin Routes
  if ((hostname === adminDomain || isAdminPath) && !isLoginPage && !isLoggedIn) {
    // If not logged in and trying to access admin, redirect to login
    const loginUrl = new URL('/login', `https://${adminDomain}`);
    return NextResponse.redirect(loginUrl);
  }

  // Handle Admin Domain
  if (hostname === adminDomain) {
    if (url.pathname === '/') {
      url.pathname = '/admin';
      return NextResponse.rewrite(url);
    }
    if (url.pathname === '/login') {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL('/', `https://${adminDomain}`));
      }
      url.pathname = '/admin/login';
      return NextResponse.rewrite(url);
    }
  } 
  // Handle Main Domain
  else if (hostname === mainDomain || hostname === `www.${mainDomain}`) {
    if (url.pathname.startsWith('/admin')) {
      const newUrl = new URL(url.pathname, `https://${adminDomain}`);
      return NextResponse.redirect(newUrl);
    }
  }

  // Explicitly return next() for all other routes to prevent NextAuth/Vercel from throwing 403
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
