import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[COUPON REDEEM] Request received');
    
    const body = await request.json();
    const { code, orderId, orderAmount, customerEmail } = body;
    
    console.log('[COUPON REDEEM] Data received:', {
      code,
      orderId,
      orderAmount,
      customerEmail
    });

    // Validate required fields
    if (!code || !orderId || !orderAmount || !customerEmail) {
      console.log('[COUPON REDEEM] Missing required fields');
      return NextResponse.json({
        error: 'Missing required fields: code, orderId, orderAmount, customerEmail'
      }, { status: 400 });
    }

    // Send tracking data to admin API
    try {
      console.log('[COUPON REDEEM] Sending to admin API...');
      
      const response = await fetch('https://eleveadmin.netlify.app/api/coupon/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          orderId,
          orderAmount: parseFloat(orderAmount),
          customerEmail,
          timestamp: new Date().toISOString(),
          source: 'e-commerce'
        })
      });

      console.log('[COUPON REDEEM] Admin API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[COUPON REDEEM] Admin API success:', data);
        
        return NextResponse.json({
          success: true,
          message: 'Coupon redeemed and ambassador stats updated',
          data
        });
      } else {
        const errorText = await response.text();
        console.error('[COUPON REDEEM] Admin API error:', errorText);
        
        return NextResponse.json({
          error: 'Failed to update ambassador stats',
          details: errorText,
          adminStatus: response.status
        }, { status: 500 });
      }
    } catch (fetchError) {
      console.error('[COUPON REDEEM] Admin API fetch error:', fetchError);
      
      return NextResponse.json({
        error: 'Failed to connect to admin API',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[COUPON REDEEM] Server error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 