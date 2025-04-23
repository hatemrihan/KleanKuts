interface PaymobPaymentData {
  amount_cents: number;
  items: Array<{
    name: string;
    amount_cents: number;
    quantity: number;
  }>;
  shipping_data: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    street: string;
    city: string;
  };
}

export async function createPaymobPayment(data: PaymobPaymentData) {
  const API_KEY = process.env.PAYMOB_API_KEY;
  if (!API_KEY) throw new Error('Paymob API key is not configured');

  // Step 1: Authentication request
  const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: API_KEY })
  });
  const authData = await authResponse.json();
  const token = authData.token;

  // Step 2: Order registration
  const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: true,
      amount_cents: data.amount_cents,
      items: data.items
    })
  });
  const orderData = await orderResponse.json();

  // Step 3: Payment key request
  const paymentKeyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      auth_token: token,
      amount_cents: data.amount_cents,
      expiration: 3600,
      order_id: orderData.id,
      billing_data: {
        ...data.shipping_data,
        apartment: 'NA',
        floor: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: 'NA',
        country: 'EG',
        state: 'NA'
      },
      currency: 'EGP',
      integration_id: process.env.PAYMOB_INTEGRATION_ID
    })
  });
  const paymentKeyData = await paymentKeyResponse.json();

  return {
    payment_key: paymentKeyData.token,
    order_id: orderData.id
  };
} 