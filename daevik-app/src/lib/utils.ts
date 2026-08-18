/**
 * Obfuscates a Supabase storage URL by replacing the direct domain with our Next.js CDN rewrite
 * This prevents Wappalyzer and other extensions from detecting Supabase/PostgreSQL from the DOM.
 */
export function hideSupabaseUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // The structure is typically: https://[project-id].supabase.co/storage/v1/object/public/[path]
  // We rewrite this to: /cdn/[path]
  const supabaseStoragePattern = /https:\/\/[^.]+\.supabase\.co\/storage\/v1\/object\/public\/(.*)/i;
  
  const match = url.match(supabaseStoragePattern);
  if (match && match[1]) {
    return `/cdn/${match[1]}`;
  }
  
  return url;
}

/**
 * Utility to process a product object and hide its Supabase URLs
 */
export function hideProductUrls<T extends Record<string, unknown>>(product: T): T {
  if (!product) return product;
  const processed = { ...product } as Record<string, unknown>;
  
  if ('thumbnail_url' in processed && typeof processed.thumbnail_url === 'string') {
    processed.thumbnail_url = hideSupabaseUrl(processed.thumbnail_url);
  }
  
  if ('product_file_url' in processed && typeof processed.product_file_url === 'string') {
    processed.product_file_url = hideSupabaseUrl(processed.product_file_url);
  }
  
  return processed as T;
}
