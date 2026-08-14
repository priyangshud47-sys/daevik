import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
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

        // Check against admin_users table
        const { data: admin, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !admin) {
          // If no admin exists and this is the default admin, auto-create
          if (
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
          ) {
            const hash = await bcrypt.hash(password, 12);
            const { data: newAdmin } = await supabase
              .from('admin_users')
              .insert({
                email,
                password_hash: hash,
              })
              .select()
              .single();

            if (newAdmin) {
              return {
                id: newAdmin.id,
                email: newAdmin.email,
              };
            }
          }
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(password, admin.password_hash);
        if (!isValid) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
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
      const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
      const isLoginPage = request.nextUrl.pathname === '/admin/login';
      const isApiAdminRoute = request.nextUrl.pathname.startsWith('/api/admin');

      // Allow login page access
      if (isLoginPage) {
        if (session?.user) {
          return Response.redirect(new URL('/admin', request.nextUrl));
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
});
