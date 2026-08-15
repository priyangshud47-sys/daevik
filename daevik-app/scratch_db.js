const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('orders').select('*');
  console.log("Orders count:", data ? data.length : 0);
  console.log("Orders:", JSON.stringify(data, null, 2));
}

check();
