import { createClient } from '@supabase/supabase-js';
import { createRazorpayOrder } from './src/lib/payments/razorpay';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: gatewayConfig } = await supabase
    .from('gateway_configs')
    .select('*')
    .eq('provider', 'razorpay')
    .eq('active', true)
    .single();

  if (!gatewayConfig) return console.log('No razorpay config');

  try {
    const order = await createRazorpayOrder({
      amount: 1,
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
      notes: { test: '123' },
      keyId: gatewayConfig.api_key,
      keySecret: gatewayConfig.api_secret,
    });
    console.log('Order created successfully:', order.id);
  } catch (error) {
    console.error('Error creating order:', error);
  }
}

test();
