const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/checkout/[slug]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { type CountryCode } from 'react-phone-number-input';", "");
content = content.replace("const [country, setCountry] = useState<CountryCode | undefined>('IN');", "const [country, setCountry] = useState<any>('IN');");

fs.writeFileSync(file, content);
console.log("Successfully fixed type error.");
