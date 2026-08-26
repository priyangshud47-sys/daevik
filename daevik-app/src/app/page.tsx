import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/database.types';

import { hideProductUrls } from '@/lib/utils';

export const revalidate = 60; // ISR: revalidate every 60 seconds

async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'live')
    .or('tag.neq.digital_file,tag.is.null')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }

  return (data || []).map(p => hideProductUrls(p));
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div>
      {/* Header */}
      <header className="site-header">
        <div className="container site-header-inner">
          <Link href="/" className="site-logo">
            Dae<span>vik</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1>
            Premium <span className="hero-accent">Digital</span> Products
          </h1>
          <p>
            Handcrafted digital products designed to elevate your journey. 
            Instant delivery, secure payments, and unique experiences.
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <main className="container">
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product, index) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="product-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="product-card-image">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}>
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <div className="product-card-body">
                  {product.tag && (
                    <span className="product-card-tag">{product.tag}</span>
                  )}
                  <h3 className="product-card-title">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
                      {product.description.length > 100
                        ? product.description.substring(0, 100) + '...'
                        : product.description}
                    </p>
                  )}
                  <div className="product-card-price">
                    <span className="currency">₹</span>{product.price.toLocaleString('en-IN')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3>Products Coming Soon</h3>
            <p>We&apos;re preparing something special. Check back soon!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Daevik. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
