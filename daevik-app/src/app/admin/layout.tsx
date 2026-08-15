import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminLayoutClient from './AdminLayoutClient';
import { headers } from 'next/headers';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If there's no session, we need to redirect them to login.
  // We don't want to cause an infinite redirect loop if they are already on /admin/login.
  // Because this layout wraps everything inside /admin, we must rely on a header check or simply
  // check if they are logged in for all child routes except login. But wait, layout.tsx wraps
  // /admin/login as well! So if we redirect here, we cannot reach /admin/login.

  // To solve this, we can get the pathname from headers (Next.js 13+ workaround)
  // or simply move the auth check to a nested layout.
  // Let's use x-invoke-path header, which Vercel/Next.js sets.
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || '';

  const isLoginPage = pathname === '/admin/login';

  if (!isLoginPage && !session?.user) {
    redirect('/admin/login');
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
