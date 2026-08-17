import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://psgpailbgutywhxrowrb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZ3BhaWxiZ3V0eXdoeHJvd3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY3MzgxOCwiZXhwIjoyMTAyMjQ5ODE4fQ.ND6a-rS9F37z2C9Stf1fcHFhWGM3WX8lGOudTUtriYM');

async function check() {
  const { data } = await supabase.from('products').select('*').eq('id', 'e36bf5fd-f10c-4629-9bf8-2d065f160f68').single();
  console.log(data.product_file_url);
}
check();
