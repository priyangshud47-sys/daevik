import crypto from 'crypto';

interface CashfreeOrderParams {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerDetails: {
    customerId: string;
    customerEmail: string;
    customerPhone: string;
    customerName: string;
  };
  returnUrl: string;
  appId: string;
  secretKey: string;
  mode?: string;
}

export async function createCashfreeOrder(params: CashfreeOrderParams) {
  const baseUrl = params.mode === 'live' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg';

  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'x-client-id': params.appId,
      'x-client-secret': params.secretKey,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.orderAmount,
      order_currency: params.orderCurrency,
      customer_details: {
        customer_id: params.customerDetails.customerId,
        customer_name: params.customerDetails.customerName,
        customer_email: params.customerDetails.customerEmail,
        customer_phone: params.customerDetails.customerPhone,
      },
      order_meta: {
        return_url: params.returnUrl,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Cashfree Order Error:', errorData);
    throw new Error(errorData.message || 'Failed to create Cashfree order');
  }

  const data = await response.json();
  return {
    paymentSessionId: data.payment_session_id,
    orderId: data.order_id,
    cfOrderId: data.cf_order_id,
    orderStatus: data.order_status,
  };
}

export function verifyCashfreeSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  secretKey: string
): boolean {
  try {
    const data = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('base64');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
