const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/products/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Import ConfirmModal
if (!content.includes('import ConfirmModal')) {
  content = content.replace(
    'import { useState, useEffect, useCallback } from \'react\';',
    'import { useState, useEffect, useCallback } from \'react\';\nimport ConfirmModal from \'@/components/ConfirmModal\';'
  );
}

// 2. Add showDeleteConfirm state
if (!content.includes('const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);')) {
  content = content.replace(
    'const [productToDelete, setProductToDelete] = useState<Product | null>(null);',
    'const [productToDelete, setProductToDelete] = useState<Product | null>(null);\n  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);'
  );
}

// 3. Update handleDeleteProduct to be called by ConfirmModal and close it
content = content.replace(
  'const handleDeleteProduct = async () => {\n    if (!productToDelete) return;\n    \n    setSaving(true);',
  `const handleDeleteProduct = async () => {\n    if (!productToDelete) return;\n    \n    setSaving(true);`
);
content = content.replace(
  'fetchProducts();\n      setProductToDelete(null);\n    } catch (err) {',
  'fetchProducts();\n      setProductToDelete(null);\n      setShowDeleteConfirm(false);\n    } catch (err) {'
);

// 4. Update the Delete confirmation UI
// We will replace the entire "productToDelete && (" block with ConfirmModal
const deleteModalRegex = /\{productToDelete && \([\s\S]*?className="btn btn-primary"[\s\S]*?onClick=\{handleDeleteProduct\}[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const newDeleteModal = `{/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Product"
        message={\`Are you sure you want to delete "\${productToDelete?.name}"? This action cannot be undone and the associated digital file will be permanently removed.\`}
        requireMatch="DELETE"
        confirmText={saving ? "Deleting..." : "Yes, Delete"}
        onConfirm={handleDeleteProduct}
        onCancel={() => {
          setProductToDelete(null);
          setShowDeleteConfirm(false);
        }}
      />`;

if (deleteModalRegex.test(content)) {
  content = content.replace(deleteModalRegex, newDeleteModal);
}

// And replace the delete button click in the table to open the modal
content = content.replace(
  /onClick=\{\(\) => setProductToDelete\(product\)\}/g,
  'onClick={() => { setProductToDelete(product); setShowDeleteConfirm(true); }}'
);

// 5. Enhance File Type Display
const fileTypeLogic = `{product.product_file_url ? (
                      <div className="flex items-center gap-2">
                        <span className="badge badge-success text-xs" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          {product.product_file_url.split('.').pop()?.split('?')[0]?.substring(0, 4) || 'FILE'}
                        </span>
                        <a href={\`/api/admin/download?url=\${encodeURIComponent(product.product_file_url)}\`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                          View
                        </a>
                      </div>
                    ) : (
                      <span className="badge badge-neutral">No File</span>
                    )}`;

content = content.replace(
  /\{product\.product_file_url \? \(\s*<a href=\{`\/api\/admin\/download\?url=\$\{encodeURIComponent\(product\.product_file_url\)\}`\} target="_blank" rel="noopener noreferrer" className="badge badge-success" style=\{\{ textDecoration: 'none' \}\}>\s*View File\s*<\/a>\s*\) : \(\s*<span className="badge badge-neutral">No File<\/span>\s*\)\}/,
  fileTypeLogic
);

fs.writeFileSync(file, content);
console.log("Patched products page");
