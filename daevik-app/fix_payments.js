const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/payments/page.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/showSecrets\[provider \+ /g, 'showSecrets[config.provider + ');
content = content.replace(/\[provider \+ field\.key\]/g, '[config.provider + field.key]');

fs.writeFileSync(file, content);
