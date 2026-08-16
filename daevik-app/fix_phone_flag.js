const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/checkout/[slug]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const oldPhoneInput = `<PhoneInput
                id="checkout-phone"
                name="tel"
                placeholder="Enter phone number"
                defaultCountry={country}
                value={formData.phone}
                onChange={(val) => {
                  let newValue = val || '';
                  if (country === 'IN' && newValue.startsWith('+91') && newValue.length > 13) {
                    newValue = newValue.slice(0, 13);
                  }
                  handleInputChange('phone', newValue);
                }}
                required
                limitMaxLength={true}
              />`;

const newPhoneInput = `<PhoneInput
                key={country}
                id="checkout-phone"
                name="tel"
                placeholder="Enter phone number"
                defaultCountry={country}
                value={formData.phone}
                onChange={(val) => {
                  let newValue = val || '';
                  if (country === 'IN' && newValue.startsWith('+91') && newValue.length > 13) {
                    newValue = newValue.slice(0, 13);
                  }
                  handleInputChange('phone', newValue);
                }}
                required
                limitMaxLength={true}
                international={true}
                countryCallingCodeEditable={false}
              />`;

content = content.replace(oldPhoneInput, newPhoneInput);

fs.writeFileSync(file, content);
console.log("Successfully added international flag lock to PhoneInput.");
