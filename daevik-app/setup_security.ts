import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://psgpailbgutywhxrowrb.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZ3BhaWxiZ3V0eXdoeHJvd3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY3MzgxOCwiZXhwIjoyMTAyMjQ5ODE4fQ.ND6a-rS9F37z2C9Stf1fcHFhWGM3WX8lGOudTUtriYM'
);

async function run() {
  console.log("1. Making bucket private...");
  const { error: bucketError } = await supabase
    .storage
    .updateBucket('product-files', {
      public: false
    });
  
  if (bucketError) console.error("Bucket Error:", bucketError.message);
  else console.log("Bucket is now PRIVATE.");

  // We can't easily run raw ALTER TABLE via standard supabase js without RPC,
  // so let's check if there is an existing RPC or we'll ask the user to do it,
  // OR we can just try querying the table to see if we can do it via a quick insert.
  // Actually, we can use the postgres API if there's a connection string, but there isn't.
  // However, I can create a migration if there's a local supabase setup, but there isn't.
}

run();
