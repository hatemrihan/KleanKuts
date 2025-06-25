import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST AMBASSADOR] Starting ambassador tracking test...');
    
    const { couponCode, testAmount } = await request.json();
    
    if (!couponCode) {
      return NextResponse.json({ 
        error: 'Please provide a couponCode to test' 
      }, { status: 400 });
    }

    // Step 1: Test coupon validation
    console.log('[TEST] Step 1: Testing coupon validation...');
    const validateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://elevee.netlify.app'}/api/coupon/validate?code=${encodeURIComponent(couponCode)}`);
    const validateData = await validateResponse.json();
    
    console.log('[TEST] Validation result:', validateData);
    
    if (!validateData.valid) {
      return NextResponse.json({
        success: false,
        step: 'validation',
        error: 'Coupon validation failed',
        details: validateData
      });
    }

    // Step 2: Test coupon redemption tracking
    console.log('[TEST] Step 2: Testing coupon redemption...');
    const redeemResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://elevee.netlify.app'}/api/coupon/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: couponCode,
        orderId: `TEST_${Date.now()}`,
        total: testAmount || 100,
        subtotal: (testAmount || 100) - 10, // Simulate shipping
        shippingCost: 10,
        discountAmount: 5,
        customerEmail: 'test@example.com'
      })
    });

    const redeemData = await redeemResponse.json();
    console.log('[TEST] Redemption result:', redeemData);

    // Step 3: Check admin API directly
    console.log('[TEST] Step 3: Testing admin API directly...');
    const adminTestResponse = await fetch('https://eleveadmin.netlify.app/api/coupon/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://elevee.netlify.app'
      },
      body: JSON.stringify({
        code: couponCode,
        orderId: `ADMIN_TEST_${Date.now()}`,
        total: testAmount || 100,
        subtotal: (testAmount || 100) - 10,
        shippingCost: 10,
        discountAmount: 5,
        customerEmail: 'test@example.com',
        timestamp: new Date().toISOString(),
        source: 'test-endpoint'
      })
    });

    const adminTestData = adminTestResponse.ok ? await adminTestResponse.json() : await adminTestResponse.text();
    console.log('[TEST] Admin API direct test result:', adminTestData);

    return NextResponse.json({
      success: true,
      message: 'Ambassador tracking test completed',
      results: {
        step1_validation: {
          success: validateData.valid,
          data: validateData
        },
        step2_redemption: {
          success: redeemResponse.ok,
          status: redeemResponse.status,
          data: redeemData
        },
        step3_admin_direct: {
          success: adminTestResponse.ok,
          status: adminTestResponse.status,
          data: adminTestData
        }
      }
    });

  } catch (error) {
    console.error('[TEST AMBASSADOR] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 