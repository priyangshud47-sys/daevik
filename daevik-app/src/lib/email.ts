// Email Automation Service (SMTP)
import * as nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  senderName?: string;
  orderId?: string;
  attachments?: { filename: string; content: Buffer }[];
}

interface TemplateData {
  customer_name: string;
  customer_email: string;
  product_name: string;
  product_price: string;
  download_link: string;
  order_id: string;
  [key: string]: string;
}

// Replace template placeholders with actual values
export function renderTemplate(template: string, data: TemplateData): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return rendered;
}

// Send email with retry logic
export async function sendEmail(params: SendEmailParams, maxRetries = 3): Promise<boolean> {
  let attempts = 0;
  let lastError: string | null = null;

  // Create email log entry
  const { data: logEntry, error: logError } = await supabase
    .from('email_logs')
    .insert({
      order_id: params.orderId || null,
      customer_email: params.to,
      subject: params.subject,
      status: 'pending',
    })
    .select()
    .single();

  if (logError) {
    console.error('Failed to create email log:', logError);
  }

  while (attempts < maxRetries) {
    attempts++;
    try {
      // 1. Check if SMTP is configured and active
      const { data: smtpConfig, error: smtpError } = await supabase
        .from('smtp_configs')
        .select('*')
        .eq('active', true)
        .limit(1)
        .single();

      if (smtpError && smtpError.code !== 'PGRST116') {
        console.error('SMTP config fetch error:', smtpError);
      }

      if (smtpConfig) {
        // Send via Nodemailer (SMTP)
        const transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          auth: {
            user: smtpConfig.username,
            pass: smtpConfig.password,
          },
        });

        await transporter.sendMail({
          from: `"${smtpConfig.from_name || params.senderName || 'Daevik'}" <${smtpConfig.from_email}>`,
          to: params.to,
          subject: params.subject,
          html: params.html,
          attachments: params.attachments,
        });
      } else {
        throw new Error('SMTP configuration not found or not active');
      }

      // Success — update log
      if (logEntry) {
        await supabase
          .from('email_logs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', logEntry.id);
      }

      return true;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }

  // All retries failed — update log
  if (logEntry) {
    await supabase
      .from('email_logs')
      .update({
        status: 'failed',
        error_message: lastError,
      })
      .eq('id', logEntry.id);
  }

  console.error(`Email send failed after ${maxRetries} attempts:`, lastError);
  throw new Error(typeof lastError === 'string' ? lastError : 'Failed to send email');
}

export async function sendProductDeliveryEmail(params: {
  customerName: string;
  customerEmail: string;
  productName: string;
  productPrice: string;
  downloadLink: string;
  orderId: string;
  productId?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  invoicePdf?: { filename: string; content: Buffer };
}): Promise<boolean> {
  // Fetch the default email template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_default', true)
    .single();

  if (!template) {
    console.error('No default email template found');
    return false;
  }

  const templateData: TemplateData = {
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    product_name: params.productName,
    product_price: params.productPrice,
    download_link: params.downloadLink,
    order_id: params.orderId,
  };

  const subject = renderTemplate(template.subject, templateData);
  const html = renderTemplate(template.body, templateData);

  const attachments: { filename: string; content: Buffer }[] = [];
  
  if (params.invoicePdf) {
    attachments.push(params.invoicePdf);
  }
  
  let finalFileUrl = params.fileUrl;
  let finalFileName = params.fileName;

  if (params.productId && !finalFileUrl) {
    const { data: product } = await supabase
      .from('products')
      .select('name, product_file_url, checkout_config')
      .eq('id', params.productId)
      .single();

    if (product) {
      const checkoutConfig = product.checkout_config as Record<string, unknown> || {};
      const attachedProductId = checkoutConfig.attached_product_id;

      if (attachedProductId) {
        const { data: attachedFile } = await supabase
          .from('products')
          .select('name, product_file_url')
          .eq('id', attachedProductId)
          .single();

        if (attachedFile) {
          finalFileUrl = attachedFile.product_file_url;
          finalFileName = attachedFile.name;
        }
      } else if (product.product_file_url) {
        finalFileUrl = product.product_file_url;
        finalFileName = product.name;
      }
    }
  }

  if (finalFileUrl) {
    try {
      let storagePath = finalFileUrl;
      let buffer: Buffer | null = null;
      let isSuccess = false;

      // Clean up path for Supabase Storage
      if (storagePath.includes('/cdn/')) {
         storagePath = storagePath.split('/cdn/product-files/')[1];
      } else {
         const match = storagePath.match(/product-files\/(.+)$/);
         if (match && match[1]) {
             storagePath = decodeURIComponent(match[1].split('?')[0]);
         }
      }

      if (storagePath) {
        const { data, error } = await supabase.storage.from('product-files').download(storagePath);
        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          isSuccess = true;
        } else {
          console.error('Supabase download error for attachment:', error);
        }
      }

      if (isSuccess && buffer) {
        
        // Extract filename and extension
        let filename = finalFileName || params.productName;
        let ext = '.pdf'; // Default fallback
        
        if (finalFileUrl.includes('/')) {
          const urlParts = finalFileUrl.split('?')[0].split('/');
          const urlName = urlParts[urlParts.length - 1];
          if (urlName && urlName.includes('.')) {
            const parts = urlName.split('.');
            ext = '.' + parts[parts.length - 1];
          }
        }

        // Ensure filename has the correct extension
        if (!filename.toLowerCase().endsWith(ext.toLowerCase())) {
          filename += ext;
        }

        attachments.push({
          filename,
          content: buffer,
        });
      } else {
        console.error('Failed to download file for attachment');
      }
    } catch (err) {
      console.error('Error downloading attachment:', err);
    }
  }

  return sendEmail({
    to: params.customerEmail,
    subject,
    html,
    senderName: template.sender_name,
    orderId: params.orderId,
    attachments: attachments.length > 0 ? attachments : undefined,
  });
}
