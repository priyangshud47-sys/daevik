const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/checkout/[slug]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add isValidPhoneNumber import
if (!content.includes('isValidPhoneNumber')) {
    content = content.replace("import PhoneInput from 'react-phone-number-input';", "import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';");
}

// Add validation to handleSubmit
const submitStart = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSubmitting(true);
    setError(null);`;

const submitWithValidation = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSubmitting(true);
    setError(null);

    if (!formData.phone || !isValidPhoneNumber(formData.phone)) {
      setError('Please enter a valid phone number for your country.');
      setSubmitting(false);
      return;
    }`;

content = content.replace(submitStart, submitWithValidation);

fs.writeFileSync(file, content);
console.log("Successfully added phone validation.");
