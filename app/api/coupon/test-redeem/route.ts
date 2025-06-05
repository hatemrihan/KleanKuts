import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST REDEEM] Request received');
    
    const body = await request.json();
    const { couponCode } = body;
    
    console.log('[TEST REDEEM] Coupon code received:', couponCode);

    if (!couponCode) {
      console.log('[TEST REDEEM] No coupon code provided');
      return NextResponse.json({
        error: 'Coupon code is required'
      }, { status: 400 });
    }

    // Send test data to admin API
    try {
      console.log('[TEST REDEEM] Sending test to admin API...');
      
      const response = await fetch('https://eleveadmin.netlify.app/api/coupon/test-redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode
        })
      });

      console.log('[TEST REDEEM] Admin API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[TEST REDEEM] Admin API success:', data);
        
        return NextResponse.json({
          success: true,
          message: 'Test redeem successful',
          data
        });
      } else {
        const errorText = await response.text();
        console.error('[TEST REDEEM] Admin API error:', errorText);
        
        return NextResponse.json({
          error: 'Test redeem failed',
          details: errorText,
          adminStatus: response.status
        }, { status: 500 });
      }
    } catch (fetchError) {
      console.error('[TEST REDEEM] Admin API fetch error:', fetchError);
      
      return NextResponse.json({
        error: 'Failed to connect to admin API for test',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[TEST REDEEM] Server error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 