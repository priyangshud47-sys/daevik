// PayU Payment Gateway Integration
import crypto from 'crypto';

interface PayUPaymentParams {
  amount: number;
  productInfo: string;
  firstName: string;
  email: string;
  transactionId: string;
  successUrl: string;
  failureUrl: string;
  phone?: string;
  merchantKey: string;
  merchantSalt: string;
  mode: 'test' | 'live';
}

interface PayUFormData {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  action: string;
}


function generatePayUHash(params: {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  merchantKey: string;
  merchantSalt: string;
}): string {
  const hashString = `${params.merchantKey}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|||||||||||${params.merchantSalt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

export function createPayUFormData(params: PayUPaymentParams): PayUFormData {
  const amount = params.amount.toFixed(2);
  const hash = generatePayUHash({
    txnid: params.transactionId,
    amount,
    productinfo: params.productInfo,
    firstname: params.firstName,
    email: params.email,
    merchantKey: params.merchantKey,
    merchantSalt: params.merchantSalt,
  });

  const baseUrl = params.mode === 'live' 
    ? 'https://secure.payu.in/_payment' 
    : 'https://test.payu.in/_payment';

  return {
    key: params.merchantKey,
    txnid: params.transactionId,
    amount,
    productinfo: params.productInfo,
    firstname: params.firstName,
    email: params.email,
    phone: params.phone || '',
    surl: params.successUrl,
    furl: params.failureUrl,
    hash,
    action: baseUrl,
  };
}

export function verifyPayUResponse(
  params: Record<string, string>,
  merchantKey: string,
  merchantSalt: string
): boolean {
  const { status, email, firstname, productinfo, amount, txnid, additionalCharges } = params;
  
  let hashString: string;
  if (additionalCharges) {
    hashString = `${additionalCharges}|${merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${merchantKey}`;
  } else {
    hashString = `${merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${merchantKey}`;
  }

  const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');
  return expectedHash === params.hash;
}
