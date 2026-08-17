const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'next.config.ts');
let content = fs.readFileSync(file, 'utf8');

// Remove the obsolete /api/landing/:slug block
content = content.replace(
  /,\s*\{\s*source:\s*'\/api\/landing\/:slug',\s*headers:\s*\[[\s\S]*?\]\s*\}/g,
  ''
);

// Add Content-Security-Policy to main headers block
const csp = `          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-src 'self' https://js.stripe.com https://api.razorpay.com;"
          }`;

content = content.replace(
  /          \{\s*key:\s*'Referrer-Policy',\s*value:\s*'origin-when-cross-origin'\s*\}/,
  csp
);

fs.writeFileSync(file, content);
console.log("Updated next.config.ts with CSP");
