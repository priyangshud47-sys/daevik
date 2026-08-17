const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/products/page.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'href={product.product_file_url}',
  'href={`/api/admin/download?url=${encodeURIComponent(product.product_file_url)}`}'
);

content = content.replace(
  'href={editingProduct.product_file_url}',
  'href={`/api/admin/download?url=${encodeURIComponent(editingProduct.product_file_url)}`}'
);

fs.writeFileSync(file, content);
console.log("Updated admin products page.");
