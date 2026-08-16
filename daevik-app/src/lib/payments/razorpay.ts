// Razorpay Payment Gateway Integration
import crypto from 'crypto';

interface RazorpayOrderParams {
  amount: number; // in smallest currency unit (paise for INR)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  keyId: string;
  keySecret: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

interface RazorpayVerifyParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  keySecret: string;
}

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1';

function getAuthHeader(keyId: string, keySecret: string): string {
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

export async function createRazorpayOrder(params: RazorpayOrderParams): Promise<RazorpayOrder> {
  const response = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(params.keyId, params.keySecret),
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100), // Convert to paise
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Razorpay order creation failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export function verifyRazorpayPayment(params: RazorpayVerifyParams): boolean {
  const body = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', params.keySecret)
    .update(body)
    .digest('hex');
  return expectedSignature === params.razorpay_signature;
}

export function verifyRazorpayWebhookSignature(body: string, signature: string, webhookSecret: string): boolean {
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
