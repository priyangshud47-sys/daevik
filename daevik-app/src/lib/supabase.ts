import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side only Supabase client using service-role key
// NEVER import this in client components

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL) {
  console.warn('SUPABASE_URL is not set. Database operations will fail.');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Database operations will fail.');
}

// Use untyped client to avoid 'never' type issues when env vars aren't present at build time
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, 'public', any> = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabase;
