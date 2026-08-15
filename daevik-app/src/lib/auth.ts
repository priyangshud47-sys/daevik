import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        console.log(`[AUTH] Attempting login for email: ${email}`);

        // Authenticate directly against Supabase's built-in Auth system
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('[AUTH] Supabase error during login:', error.message);
          return null;
        }
        
        if (!data?.user) {
          console.error('[AUTH] Supabase login succeeded but no user data returned.');
          return null;
        }

        console.log(`[AUTH] Login successful for user: ${data.user.id}`);

        return {
          id: data.user.id,
          email: data.user.email,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    async authorized({ auth: session, request }) {
      const hostname = request.headers.get('host') || '';
      const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'admin.daevik.in';
      const isAdminDomain = hostname === adminDomain || hostname.endsWith(`.${adminDomain}`);

      const pathname = request.nextUrl.pathname;
      const isAdminRoute = pathname.startsWith('/admin') || (isAdminDomain && pathname === '/');
      const isLoginPage = pathname === '/admin/login' || (isAdminDomain && pathname === '/login');
      const isApiAdminRoute = pathname.startsWith('/api/admin');

      // Allow login page access
      if (isLoginPage) {
        if (session?.user) {
          return Response.redirect(new URL(isAdminDomain ? '/' : '/admin', request.nextUrl));
        }
        return true;
      }

      // Protect admin routes
      if (isAdminRoute || isApiAdminRoute) {
        return !!session?.user;
      }

      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
