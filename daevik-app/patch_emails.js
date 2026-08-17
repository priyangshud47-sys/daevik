const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/emails/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Validate {{download_link}} before save
const validationCheck = `  const handleSave = async () => {
    if (!editing) return;
    
    if (!form.body.includes('{{download_link}}')) {
      showToast('Template must include {{download_link}} placeholder', 'error');
      return;
    }
    
    setSaving(true);`;

content = content.replace(
  '  const handleSave = async () => {\n    if (!editing) return;\n    setSaving(true);',
  validationCheck
);

// 2. Add Test Connection function for SMTP
const testSmtpFn = `  const [testingSmtp, setTestingSmtp] = useState(false);
  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const res = await fetch('/api/admin/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpForm),
      });

      if (res.ok) {
        showToast('SMTP Connection Successful!', 'success');
      } else {
        throw new Error('Connection failed');
      }
    } catch {
      showToast('SMTP Connection Failed. Check credentials.', 'error');
    } finally {
      setTestingSmtp(false);
    }
  };`;

content = content.replace(
  '  const handleSaveSmtp = async () => {',
  testSmtpFn + '\n\n  const handleSaveSmtp = async () => {'
);

// 3. Add Test Connection button to UI
content = content.replace(
  '<button className="btn btn-secondary" style={{ marginTop: \'var(--space-2)\' }} onClick={handleSaveSmtp} disabled={savingSmtp}>',
  `<div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button className="btn btn-secondary" onClick={handleTestSmtp} disabled={testingSmtp}>
                  {testingSmtp ? 'Testing...' : 'Test Connection'}
                </button>
                <button className="btn btn-primary" onClick={handleSaveSmtp} disabled={savingSmtp}>`
);
content = content.replace(
  '{savingSmtp ? \'Saving...\' : \'Save SMTP Settings\'}\n              </button>',
  '{savingSmtp ? \'Saving...\' : \'Save Settings\'}\n                </button>\n              </div>'
);

fs.writeFileSync(file, content);
console.log("Patched emails page");
