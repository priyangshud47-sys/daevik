import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: logs } = await supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Email Logs:', logs);
  
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Orders:', orders);
}

check();
