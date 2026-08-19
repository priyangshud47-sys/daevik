'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { ToastProvider } from '@/components/ToastProvider';

const navItems = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    ],
  },
  {
    section: 'Commerce',
    items: [
      { label: 'Products', href: '/admin/products', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
      { label: 'Projects', href: '/admin/projects', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { label: 'Orders & Customers', href: '/admin/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { label: 'Funnel Analytics', href: '/admin/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { label: 'SEO', href: '/admin/seo', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
      { label: 'Facebook CAPI', href: '/admin/facebook', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { label: 'Email Templates', href: '/admin/emails', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { label: 'Payment Gateways', href: '/admin/payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    ],
  },
];

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/projects': 'Projects',
  '/admin/orders': 'Orders & Customers',
  '/admin/analytics': 'Funnel Analytics',
  '/admin/seo': 'SEO Settings',
  '/admin/facebook': 'Facebook CAPI',
  '/admin/emails': 'Email Templates',
  '/admin/payments': 'Payment Gateways',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Esc to close
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Session activity simulator (could be based on NextAuth session exp)
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionActive(Math.random() > 0.1); // Mock 10% chance of idle/inactive
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Don't wrap login page in admin layout
  if (pathname === '/admin/login' || pathname === '/login') {
    return <>{children}</>;
  }

  const pageTitle = pageTitles[pathname] || 'Admin';

  return (
    <ToastProvider>
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <h2>Daevik</h2>
          <span>Admin Panel</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((section) => (
            <div key={section.section}>
              <div className="admin-nav-section">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="admin-nav-item"
            style={{
              width: '100%',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 'var(--space-3) 0',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              id="mobile-menu-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="admin-header-title">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search */}
            <button 
              className="btn btn-icon btn-ghost text-muted"
              onClick={() => setSearchOpen(true)}
              title="Search (Cmd+K)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-icon btn-ghost text-muted"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <div style={{ position: 'relative' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--color-error)', borderRadius: '50%' }}></span>
                </div>
              </button>
              
              {notificationsOpen && (
                <div className="card-outer animate-fade-in-up" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '300px', zIndex: 50, transformOrigin: 'top right' }}>
                  <div className="card-inner" style={{ padding: 'var(--space-4)' }}>
                    <h4 className="text-sm font-bold mb-3 eyebrow" style={{ marginBottom: 'var(--space-4)' }}>Notifications</h4>
                    <div className="text-sm text-muted mb-3" style={{ padding: 'var(--space-2)', background: 'var(--color-bg-warm)', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ color: 'var(--color-primary)' }}>New order #1024</strong> placed
                    </div>
                    <div className="text-sm text-muted mb-4" style={{ padding: 'var(--space-2)', background: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-sm)' }}>
                      Payment gateway error
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', fontSize: '14px', padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>Mark all read</span>
                        <span className="btn-nested-icon" style={{ width: '20px', height: '20px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Session Activity Indicator */}
            <div className="flex items-center gap-2" title={sessionActive ? 'Session Active' : 'Session Expiring Soon'}>
               <span style={{ width: 10, height: 10, borderRadius: '50%', background: sessionActive ? 'var(--color-success)' : 'var(--color-warning)' }}></span>
               <span className="text-sm text-muted hidden sm:inline-block">Admin</span>
            </div>
          </div>

        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>


      {/* Global Search Modal */}
      {searchOpen && (
        <div className="modal-overlay" onClick={() => setSearchOpen(false)}>
           <div className="card-outer animate-fade-in-up" style={{ width: '100%', maxWidth: '600px', margin: '0 20px', height: 'fit-content' }} onClick={(e) => e.stopPropagation()}>
             <div className="card-inner" style={{ padding: 'var(--space-6)' }}>
               <div className="flex justify-between items-center mb-4">
                  <input 
                    type="text" 
                    className="form-input w-full" 
                    style={{ fontSize: '18px', padding: '16px', background: 'var(--color-bg-warm)', border: 'none' }}
                    placeholder="Search orders, customers, projects... (Press Esc)"
                    autoFocus
                  />
               </div>
               <span className="eyebrow" style={{ marginTop: 'var(--space-4)' }}>Recent Searches</span>
               <div className="mt-3 text-sm cursor-pointer admin-nav-item" onClick={() => { setSearchOpen(false); router.push('/admin/orders'); }}>Order #1234</div>
               <div className="mt-1 text-sm cursor-pointer admin-nav-item" onClick={() => { setSearchOpen(false); router.push('/admin/projects'); }}>Zero Investment Guide</div>
             </div>
           </div>
        </div>
      )}

      {/* Show mobile menu button */}
      <style>{`
        @media (max-width: 1024px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
    </ToastProvider>
  );
}
