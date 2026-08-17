const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/admin/orders/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `<p><strong>Amount:</strong> {selectedOrder.currency === 'INR' ? '₹' : '\n            </div>`;
const replacement = `<p><strong>Amount:</strong> {selectedOrder.currency === 'INR' ? '₹' : '$'}{Number(selectedOrder.amount).toLocaleString('en-IN')}</p>\n            </div>`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('Fixed orders properly');
