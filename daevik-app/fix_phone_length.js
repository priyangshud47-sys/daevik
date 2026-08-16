const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/checkout/[slug]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const oldOnChange = `onChange={(val) => handleInputChange('phone', val || '')}`;
const newOnChange = `onChange={(val) => {
                  let newValue = val || '';
                  if (country === 'IN' && newValue.startsWith('+91') && newValue.length > 13) {
                    newValue = newValue.slice(0, 13);
                  }
                  handleInputChange('phone', newValue);
                }}`;

content = content.replace(oldOnChange, newOnChange);

fs.writeFileSync(file, content);
console.log("Successfully added explicit length truncation for India.");
