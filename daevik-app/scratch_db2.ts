import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://psgpailbgutywhxrowrb.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZ3BhaWxiZ3V0eXdoeHJvd3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY3MzgxOCwiZXhwIjoyMTAyMjQ5ODE4fQ.ND6a-rS9F37z2C9Stf1fcHFhWGM3WX8lGOudTUtriYM');

async function check() {
  const { data, error } = await supabase.storage.getBucket('product-files');
  console.log('Bucket:', data);
}
check();
