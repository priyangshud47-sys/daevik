const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n');
let url = '', key = '';
env.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1];
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1];
});
const supabase = createClient(url, key);
supabase.from('products').select('landing_page_html').eq('slug', 'zero-investment-guide').single().then(res => {
  fs.writeFileSync('landing.html', res.data.landing_page_html);
  console.log('Done');
});
