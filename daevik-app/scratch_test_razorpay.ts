import crypto from 'crypto';

function verifyRazorpayWebhookSignature(body: string, signature: string, webhookSecret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

const secret = '1234567890';
const body = JSON.stringify({ event: 'payment.captured' });
const validSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
const invalidSignature = 'invalid';
const invalidLengthSignature = validSignature.substring(0, 10);

console.log('Valid:', verifyRazorpayWebhookSignature(body, validSignature, secret) === true);
console.log('Invalid Content:', verifyRazorpayWebhookSignature(body, validSignature.replace('a', 'b'), secret) === false);
console.log('Invalid Length:', verifyRazorpayWebhookSignature(body, invalidLengthSignature, secret) === false);
console.log('Invalid Format:', verifyRazorpayWebhookSignature(body, invalidSignature, secret) === false);
