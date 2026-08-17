const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/facebook/page.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'fetch(`/api/admin/facebook/${id}`, {',
  'fetch(`/api/admin/facebook`, {'
);

content = content.replace(
  'body: JSON.stringify({ active: !currentStatus }),',
  'body: JSON.stringify({ id, active: !currentStatus }),'
);

fs.writeFileSync(file, content);
