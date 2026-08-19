import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('products').select('slug, gateway_provider').eq('slug', 'zero-investment-guide').single().then(console.log);
