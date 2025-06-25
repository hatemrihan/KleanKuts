import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[COUPON REDEEM] Request received');
    
    const body = await request.json();
    console.log('[COUPON REDEEM] Raw body data:', body);
    
    // Handle both old and new data formats
    const { 
      code, 
      orderId, 
      orderAmount, // old format
      total, // new format
      subtotal,
      shippingCost,
      discountAmount,
      customerEmail 
    } = body;
    
    // Use new format if available, fallback to old format
    const finalOrderAmount = orderAmount || total || 0;
    const finalSubtotal = subtotal || (finalOrderAmount - (shippingCost || 0));
    
    console.log('[COUPON REDEEM] Processed data:', {
      code,
      orderId,
      finalOrderAmount,
      finalSubtotal,
      shippingCost: shippingCost || 0,
      discountAmount: discountAmount || 0,
      customerEmail
    });

    // Validate required fields
    if (!code || !orderId || !finalOrderAmount || !customerEmail) {
      console.log('[COUPON REDEEM] Missing required fields');
      return NextResponse.json({
        error: 'Missing required fields: code, orderId, orderAmount/total, customerEmail'
      }, { status: 400 });
    }

    // Send comprehensive tracking data to admin API
    try {
      console.log('[COUPON REDEEM] Sending to admin API...');
      
      const adminPayload = {
        code,
        orderId,
        total: finalOrderAmount,
        subtotal: finalSubtotal,
        shippingCost: shippingCost || 0,
        discountAmount: discountAmount || 0,
        customerEmail,
        timestamp: new Date().toISOString(),
        source: 'e-commerce-fixed'
      };
      
      console.log('[COUPON REDEEM] Admin payload:', adminPayload);
      
      const response = await fetch('https://eleveadmin.netlify.app/api/coupon/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://elevee.netlify.app'
        },
        body: JSON.stringify(adminPayload)
      });

      console.log('[COUPON REDEEM] Admin API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[COUPON REDEEM] Admin API success:', data);
        
        return NextResponse.json({
          success: true,
          message: 'Coupon redeemed and ambassador stats updated',
          data,
          payload: adminPayload // Return payload for debugging
        });
      } else {
        const errorText = await response.text();
        console.error('[COUPON REDEEM] Admin API error:', errorText);
        
        return NextResponse.json({
          error: 'Failed to update ambassador stats',
          details: errorText,
          adminStatus: response.status,
          payload: adminPayload // Return payload for debugging
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