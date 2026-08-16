const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/checkout/zero-investment-guide/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add imports
if (!content.includes('react-phone-number-input')) {
    content = content.replace(
        "import { trackFbEvent } from '@/lib/fb-client';",
        "import { trackFbEvent } from '@/lib/fb-client';\nimport PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';\nimport 'react-phone-number-input/style.css';"
    );
}

// Add state
if (!content.includes('const [country, setCountry] = useState<any>(\'IN\');')) {
    content = content.replace(
        "const [formData, setFormData] = useState({",
        "const [country, setCountry] = useState<any>('IN');\n  const [formData, setFormData] = useState({"
    );
}

// Add IP fetch
if (!content.includes('ipapi.co')) {
    const geoFetch = `
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code) {
          setCountry(data.country_code);
        }
      })
      .catch(() => {});
  }, []);
`;
    content = content.replace(
        "const searchParams = useSearchParams();",
        "const searchParams = useSearchParams();\n" + geoFetch
    );
}

// Add Phone validation to handleSubmit
if (!content.includes('isValidPhoneNumber(formData.phone)')) {
    content = content.replace(
        "setSubmitting(true);\n    setError(null);",
        "setSubmitting(true);\n    setError(null);\n\n    if (!formData.phone || !isValidPhoneNumber(formData.phone)) {\n      setError('Please enter a valid phone number for your country.');\n      setSubmitting(false);\n      return;\n    }"
    );
}

// Replace standard input with PhoneInput
const oldInputRegex = /<input\s+id="zig-phone"[\s\S]*?onChange=\{\(e\) => handleInputChange\('phone', e\.target\.value\)\}\s+\/>/;
const newPhoneInput = `{country && (
                      <PhoneInput
                        key={country}
                        id="zig-phone"
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
                        className="zig-input"
                        style={{ padding: 0 }}
                      />
                    )}`;

content = content.replace(oldInputRegex, newPhoneInput);

fs.writeFileSync(file, content);
console.log("Successfully updated hardcoded checkout.");
