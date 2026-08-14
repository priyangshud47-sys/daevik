// PayPal Payment Gateway Integration (Orders API v2)
import crypto from 'crypto';



interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

async function getAccessToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(params: {
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  clientId: string;
  clientSecret: string;
  mode: 'test' | 'live';
}): Promise<PayPalOrder> {
  const baseUrl = params.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const accessToken = await getAccessToken(params.clientId, params.clientSecret, baseUrl);

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: params.currency || 'USD',
            value: params.amount.toFixed(2),
          },
          description: params.description,
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        brand_name: 'Daevik',
        user_action: 'PAY_NOW',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal order creation failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function capturePayPalOrder(
  orderId: string,
  clientId: string,
  clientSecret: string,
  mode: 'test' | 'live'
): Promise<{
  id: string;
  status: string;
  payer: { email_address: string; name: { given_name: string; surname: string } };
}> {
  const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const accessToken = await getAccessToken(clientId, clientSecret, baseUrl);

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal capture failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export function verifyPayPalWebhookSignature(
  body: string,
  headers: Record<string, string>,
  webhookId: string
): boolean {
  // PayPal webhook signature verification
  const transmissionId = headers['paypal-transmission-id'];
  const timestamp = headers['paypal-transmission-time'];
  const crc = crypto.createHash('crc32').update(body).digest('hex');
  
  // Simplified verification — in production, use PayPal's verify-webhook-signature API
  const expectedSignature = `${transmissionId}|${timestamp}|${webhookId}|${crc}`;
  const computedSignature = crypto
    .createHmac('sha256', webhookId)
    .update(expectedSignature)
    .digest('base64');

  return computedSignature === headers['paypal-transmission-sig'];
}
