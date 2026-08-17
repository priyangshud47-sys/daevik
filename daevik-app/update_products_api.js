const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/api/admin/products/route.ts');
let content = fs.readFileSync(file, 'utf8');

const zodImport = `import { z } from 'zod';\n\nconst productSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(255),
  price: z.number().min(0),
  description: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  product_file_url: z.string().nullable().optional(),
  gateway_provider: z.enum(['razorpay', 'payu', 'paypal']).default('razorpay'),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  og_image_url: z.string().url().nullable().optional(),
  status: z.enum(['live', 'draft', 'archived']).default('draft'),
});\n`;

content = content.replace('import { hideProductUrls } from \'@/lib/utils\';', 'import { hideProductUrls } from \'@/lib/utils\';\n' + zodImport);

const replacementPOST = `  try {
    const body = await request.json();
    
    // Validate payload and strip out any unknown fields (like landing_page_html)
    const validationResult = productSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: validationResult.error.errors }, { status: 400 });
    }
    
    const validData = validationResult.data;

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...validData
      })
      .select()
      .single();`;

content = content.replace(/  try \{\n    const body = await request\.json\(\);\n\n    const \{ data, error \} = await supabase\n      \.from\('products'\)\n      \.insert\(\{\n[\s\S]*?\}\)\n      \.select\(\)\n      \.single\(\);/, replacementPOST);

fs.writeFileSync(file, content);
console.log("Updated POST API with zod");
