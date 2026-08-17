const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/facebook/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Validation logic
const validationCheck = `  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!/^\\d+$/.test(form.pixel_id.trim())) {
      showToast('Pixel ID must contain only numbers', 'error');
      return;
    }
    if (form.access_token.trim().length < 20) {
      showToast('Access Token seems too short to be valid', 'error');
      return;
    }
    
    setSaving(true);`;

content = content.replace(
  '  const handleAdd = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setSaving(true);',
  validationCheck
);

// 2. Active Toggle UI
if (!content.includes('const toggleActive = async (id: string, currentStatus: boolean)')) {
  const toggleActiveFn = `  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(\`/api/admin/facebook/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      });
      if (res.ok) {
        showToast('Status updated', 'success');
        fetchConfigs();
      } else {
        throw new Error('Failed to update status');
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };`;
  content = content.replace(
    '  const handleDelete = async (id: string) => {',
    toggleActiveFn + '\n\n  const handleDelete = async (id: string) => {'
  );
}

// 3. Add column for Active Status
content = content.replace(
  '<th>Test Event Code</th>',
  '<th>Test Event Code</th>\n                <th>Status</th>'
);

content = content.replace(
  '<td style={{ textAlign: \'right\' }}>\n                    <button \n                      className="btn btn-sm btn-ghost text-error" \n                      onClick={() => handleDelete(c.id)}\n                    >\n                      Delete\n                    </button>\n                  </td>',
  `<td>
                    <button 
                      className={\`btn btn-sm \${c.active ? 'btn-success' : 'btn-secondary'}\`} 
                      onClick={() => toggleActive(c.id, c.active)}
                    >
                      {c.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-sm btn-ghost text-error" 
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </td>`
);

// 4. Implement actual ConfirmModal for Delete
if (!content.includes('import ConfirmModal')) {
  content = content.replace(
    'import { useState, useEffect, useCallback } from \'react\';',
    'import { useState, useEffect, useCallback } from \'react\';\nimport ConfirmModal from \'@/components/ConfirmModal\';'
  );
}

if (!content.includes('const [itemToDelete, setItemToDelete] = useState')) {
  content = content.replace(
    'const [toast, setToast] = useState<{ message: string; type: \'success\' | \'error\' } | null>(null);',
    'const [toast, setToast] = useState<{ message: string; type: \'success\' | \'error\' } | null>(null);\n  const [itemToDelete, setItemToDelete] = useState<string | null>(null);'
  );
}

content = content.replace(
  '  const handleDelete = async (id: string) => {\n    if (!confirm(\'Are you sure you want to delete this configuration?\')) return;\n    \n    try {',
  `  const handleDelete = async (id: string) => {\n    try {`
);

content = content.replace(
  /onClick=\{\(\) => handleDelete\(c\.id\)\}/g,
  'onClick={() => setItemToDelete(c.id)}'
);

content = content.replace(
  '{/* Add Modal */}',
  `{/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Facebook Config"
        message="Are you sure you want to delete this configuration? Tracking will stop immediately."
        confirmText="Delete"
        onConfirm={() => {
          if (itemToDelete) handleDelete(itemToDelete);
          setItemToDelete(null);
        }}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Add Modal */}`
);


fs.writeFileSync(file, content);
console.log("Patched facebook page");
