const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/seo/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Title warning
content = content.replace(
  '<span className="form-hint">\n                      {(forms[product.id]?.seo_title || \'\').length}/60 characters\n                    </span>',
  `<span className={\`form-hint \${(forms[product.id]?.seo_title || '').length > 60 ? 'text-error font-semibold' : ''}\`}>
                      {(forms[product.id]?.seo_title || '').length}/60 characters
                      {(forms[product.id]?.seo_title || '').length > 60 && ' (Warning: Title may be truncated in search results)'}
                    </span>`
);

// Description warning
content = content.replace(
  '<span className="form-hint">\n                      {(forms[product.id]?.seo_description || \'\').length}/160 characters\n                    </span>',
  `<span className={\`form-hint \${(forms[product.id]?.seo_description || '').length > 160 ? 'text-error font-semibold' : ''}\`}>
                      {(forms[product.id]?.seo_description || '').length}/160 characters
                      {(forms[product.id]?.seo_description || '').length > 160 && ' (Warning: Description may be truncated in search results)'}
                    </span>`
);

fs.writeFileSync(file, content);
console.log("Patched seo page");
