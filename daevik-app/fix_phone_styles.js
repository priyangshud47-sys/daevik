const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/checkout/zero-investment-guide/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the PhoneInput className
content = content.replace(
  'className="zig-input"\n                        style={{ padding: \'0 14px\' }}',
  'className="zig-phone-container"'
);

// Add the custom CSS
const newCss = `
      .zig-phone-container {
        display: flex;
        align-items: center;
        width: 100%;
        border: 1.5px solid var(--zig-border);
        border-radius: 10px;
        background: var(--zig-white);
        transition: all 0.2s ease;
      }
      .zig-phone-container:focus-within {
        border-color: var(--zig-emerald);
        box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
      }
      .zig-phone-container .PhoneInputCountry {
        display: flex;
        align-items: center;
        padding-left: 14px;
        padding-right: 10px;
        border-right: 1px solid var(--zig-border);
        margin-right: 10px;
      }
      .zig-phone-container .PhoneInputInput {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        padding: 12px 14px 12px 0;
        font-size: 0.95rem;
        font-family: 'Inter', sans-serif;
        color: var(--zig-text);
        outline: none;
      }
      .zig-phone-container .PhoneInputInput::placeholder {
        color: #94A3B8;
      }
      .zig-hint {`;

content = content.replace("      .zig-hint {", newCss);

fs.writeFileSync(file, content);
console.log("Successfully optimized PhoneInput styles.");
