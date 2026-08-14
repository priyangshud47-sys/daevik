import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: product } = await supabase
    .from('products')
    .select('name, seo_title, seo_description, og_image_url')
    .eq('slug', slug)
    .eq('status', 'live')
    .single();

  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.seo_title || `${product.name} — Daevik`,
    description: product.seo_description || `Get ${product.name} from Daevik.`,
    openGraph: {
      title: product.seo_title || product.name,
      description: product.seo_description || undefined,
      images: product.og_image_url ? [product.og_image_url] : undefined,
    },
  };
}

export default async function ProductLandingPage({ params }: Props) {
  const { slug } = await params;

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'live')
    .single();

  if (error || !product) {
    notFound();
  }

  // If product has custom landing page HTML, render it in an iframe
  if (product.landing_page_html || product.landing_page_url) {
    const iframeSrc = product.landing_page_url
      ? product.landing_page_url
      : `/api/landing/${product.slug}`;

    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <iframe
          src={iframeSrc}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title={product.name}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  }

  // Default product page if no custom landing page is uploaded
  return (
    <div className="checkout-layout">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <header style={{ marginBottom: 'var(--space-8)' }}>
          <a href="/" className="site-logo" style={{ fontSize: 'var(--text-xl)' }}>
            Dae<span style={{ color: 'var(--color-secondary)' }}>vik</span>
          </a>
        </header>

        <div className="card card-elevated" style={{ padding: 'var(--space-10)' }}>
          {product.thumbnail_url && (
            <div style={{ marginBottom: 'var(--space-6)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <img src={product.thumbnail_url} alt={product.name} style={{ width: '100%' }} />
            </div>
          )}

          {product.tag && (
            <span className="product-card-tag" style={{ marginBottom: 'var(--space-3)', display: 'inline-block' }}>
              {product.tag}
            </span>
          )}

          <h1 style={{ marginBottom: 'var(--space-4)' }}>{product.name}</h1>

          {product.description && (
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
              {product.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>

          <a href={`/checkout/${product.slug}`} className="btn btn-primary btn-lg" style={{ width: '100%', textAlign: 'center' }}>
            Buy Now
          </a>
        </div>
      </div>
    </div>
  );
}
