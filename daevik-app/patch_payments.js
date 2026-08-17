const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/payments/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add showSecrets state
if (!content.includes('const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})')) {
  content = content.replace(
    'const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});',
    'const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});\n  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});'
  );
}

// 2. Add validation before handleSave and toggleActive
const validationCheck = `  const validateConfig = (provider: string) => {
    const data = formData[provider];
    if (!data) return false;
    const info = gatewayInfo[provider];
    return info.fields.every(f => !!data[f.key]?.trim());
  };`;

if (!content.includes('const validateConfig')) {
  content = content.replace(
    'const handleSave = async (provider: string) => {',
    validationCheck + '\n\n  const handleSave = async (provider: string) => {\n    if (!validateConfig(provider)) {\n      showToast("Please fill all required fields", "error");\n      return;\n    }'
  );
}

// 3. Prevent activate if invalid
content = content.replace(
  'const toggleActive = async (provider: string, active: boolean) => {\n    try {',
  'const toggleActive = async (provider: string, active: boolean) => {\n    if (active && !validateConfig(provider)) {\n      showToast("Please fill all fields and save before activating", "error");\n      return;\n    }\n    try {'
);

// 4. Update the badges to show Live/Test
content = content.replace(
  '<div className="flex items-center gap-3">\n                  <span className={`badge ${config.active ? \'badge-success\' : \'badge-neutral\'}`}>\n                    {config.active ? \'Active\' : \'Inactive\'}\n                  </span>',
  `<div className="flex items-center gap-3">
                  <span className={\`badge \${formData[config.provider]?.mode === 'live' ? 'badge-error' : 'badge-warning'}\`}>
                    {formData[config.provider]?.mode === 'live' ? 'LIVE MODE' : 'TEST MODE'}
                  </span>
                  <span className={\`badge \${config.active ? 'badge-success' : 'badge-neutral'}\`}>
                    {config.active ? 'Active' : 'Inactive'}
                  </span>`
);

// 5. Add eye icon to show/hide secrets
content = content.replace(
  /type=\{field\.key === 'webhook_secret' \? 'text' : 'password'\}/g,
  `type={field.key === 'webhook_secret' || showSecrets[provider + field.key] ? 'text' : 'password'}`
);

content = content.replace(
  /onChange=\{\(e\) =>\n[\s\S]*?\}\n\s*\/>/g,
  `$&
                      {field.key !== 'webhook_secret' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowSecrets(prev => ({ ...prev, [provider + field.key]: !prev[provider + field.key] }))}
                        >
                          {showSecrets[provider + field.key] ? 'Hide' : 'Show'}
                        </button>
                      )}`
);

// Fix the undefined 'provider' in the map. The map uses config.provider.
content = content.replace(/showSecrets\[provider \+/g, 'showSecrets[config.provider + ');

fs.writeFileSync(file, content);
console.log("Patched payments page");
