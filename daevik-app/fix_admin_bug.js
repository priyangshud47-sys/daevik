const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/api/admin/products/[slug]/route.ts');
let content = fs.readFileSync(file, 'utf8');

const oldLogic = `    // If file was replaced, delete the old one
    if (
      existingProduct?.product_file_url && 
      update.product_file_url && 
      existingProduct.product_file_url !== update.product_file_url
    ) {
      const oldPath = extractStoragePath(existingProduct.product_file_url);
      if (oldPath) {
        await supabase.storage.from('product-files').remove([oldPath]);
      }
    }`;

const newLogic = `    // If file was replaced, delete the old one
    const oldPath = extractStoragePath(existingProduct?.product_file_url as string | null);
    const newPath = update.product_file_url ? extractStoragePath(update.product_file_url as string | null) : null;
    
    if (oldPath) {
      if (!update.product_file_url || (newPath && oldPath !== newPath)) {
        // File was removed or changed to a different file
        await supabase.storage.from('product-files').remove([oldPath]);
      }
    }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(file, content);
console.log("Fixed [slug]/route.ts");

const file2 = path.join(__dirname, 'src/app/api/admin/products/route.ts');
if (fs.existsSync(file2)) {
  console.log("Checking route.ts for similar bug...");
}
