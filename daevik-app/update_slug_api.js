const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/api/admin/products/[slug]/route.ts');
let content = fs.readFileSync(file, 'utf8');

const zodImport = `import { z } from 'zod';\n\nconst productUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(255).optional(),
  price: z.number().min(0).optional(),
  description: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  product_file_url: z.string().nullable().optional(),
  gateway_provider: z.enum(['razorpay', 'payu', 'paypal']).optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  og_image_url: z.string().url().nullable().optional(),
  status: z.enum(['live', 'draft', 'archived']).optional(),
  checkout_config: z.any().optional(), // allow any json for now
});\n`;

content = content.replace('import { hideProductUrls } from \'@/lib/utils\';', 'import { hideProductUrls } from \'@/lib/utils\';\n' + zodImport);

const replacementPUT = `    const body = await request.json();

    // Validate payload and strip out any unknown fields (like landing_page_html)
    const validationResult = productUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: validationResult.error.errors }, { status: 400 });
    }
    
    const validData = validationResult.data;

    const { data: existingProduct } = await supabase
      .from('products')
      .select('product_file_url')
      .eq('slug', slug)
      .single();

    const { data, error } = await supabase
      .from('products')
      .update(validData)
      .eq('slug', slug)
      .select()
      .single();`;

content = content.replace(/    const body = await request\.json\(\);\n\n    const \{ data: existingProduct \} = await supabase\n[\s\S]*?      \.select\(\)\n      \.single\(\);/, replacementPUT);

fs.writeFileSync(file, content);
console.log("Updated PUT API with zod");
