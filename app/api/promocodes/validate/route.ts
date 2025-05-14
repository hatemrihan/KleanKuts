import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/app/lib/mongodb'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Promo code is required' }, { status: 400 })
    }

    await dbConnect();
    
    // Define the PromoCode schema if not already defined
    const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', new mongoose.Schema({
      code: String,
      type: String,
      value: Number,
      minPurchase: Number,
      maxUses: Number,
      usedCount: Number,
      startDate: Date,
      endDate: Date,
      isActive: Boolean,
      referralCode: String,
      couponCode: String
    }));

    // Find the promo code (case insensitive)
    const promoCode = await PromoCode.findOne({ 
      code: { $regex: new RegExp(`^${code}$`, 'i') },
      isActive: true
    });

    // Check for ambassador coupon code if promo code not found
    let ambassador = null;
    if (!promoCode) {
      const Ambassador = mongoose.models.Ambassador || mongoose.model('Ambassador', new mongoose.Schema({
        email: String,
        name: String,
        status: String,
        sales: Number,
        earnings: Number,
        paymentsPending: Number,
        paymentsPaid: Number,
        referralCode: String,
        couponCode: String,
        discountValue: Number,
        discountType: String
      }, { collection: 'ambassadors' }));

      ambassador = await Ambassador.findOne({
        couponCode: { $regex: new RegExp(`^${code}$`, 'i') },
        status: 'approved'
      });
    }

    if (!promoCode && !ambassador) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired promo code' }, { status: 404 })
    }

    let discountInfo;

    // Process promo code or ambassador code
    if (promoCode) {
      // Check if promo code is still valid based on dates
      const now = new Date();
      if (promoCode.startDate && new Date(promoCode.startDate) > now) {
        return NextResponse.json({ valid: false, error: 'This promo code is not active yet' }, { status: 400 })
      }
      
      if (promoCode.endDate && new Date(promoCode.endDate) < now) {
        return NextResponse.json({ valid: false, error: 'This promo code has expired' }, { status: 400 })
      }
      
      // Check if promo code has reached max uses
      if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
        return NextResponse.json({ valid: false, error: 'This promo code has reached its usage limit' }, { status: 400 })
      }

      // Return valid promo code with discount info
      discountInfo = {
        type: promoCode.type || 'percentage', // 'percentage' or 'fixed'
        value: promoCode.value || 0,
        minPurchase: promoCode.minPurchase || 0,
        code: promoCode.code,
        referralCode: promoCode.referralCode || null,
        isAmbassador: false
      };
    } else {
      // Ambassador code logic
      // CRITICAL: Check all possible field names where admin could store discount percentage
      // The field name could be different based on the admin panel implementation
      let discountValue = 10; // Default fallback only if no value found
      
      // Get the full ambassador document and log it for debugging
      const fullAmbassador = await mongoose.connection.collection('ambassadors').findOne({ 
        couponCode: { $regex: new RegExp(`^${code}$`, 'i') },
        status: 'approved'
      });
      
      console.log('Full ambassador document from database:', JSON.stringify(fullAmbassador, null, 2));
      
      // Check all possible field names for discount percentage
      if (fullAmbassador) {
        // Look for ALL possible field names where discount percentage could be stored
        if (typeof fullAmbassador.discountPercentage === 'number') {
          discountValue = fullAmbassador.discountPercentage;
          console.log(`Found discountPercentage: ${discountValue}%`);
        } else if (typeof fullAmbassador.discountValue === 'number') {
          discountValue = fullAmbassador.discountValue;
          console.log(`Found discountValue: ${discountValue}%`);
        } else if (typeof fullAmbassador.discount === 'number') {
          discountValue = fullAmbassador.discount;
          console.log(`Found discount: ${discountValue}%`);
        } else {
          // Try to find ANY field with a number value that could be a percentage
          Object.entries(fullAmbassador).forEach(([key, value]) => {
            if (typeof value === 'number' && key.toLowerCase().includes('discount') || key.toLowerCase().includes('percent')) {
              console.log(`Found potential discount field: ${key} = ${value}`);
              discountValue = value;
            }
          });
        }
      }
      
      console.log(`Ambassador ${ambassador.name || 'unknown'} (${ambassador.email}) coupon applied with ${discountValue}% discount`);
      
      
      discountInfo = {
        type: ambassador.discountType || 'percentage',
        value: discountValue,
        minPurchase: 0,
        code: ambassador.couponCode,
        referralCode: ambassador.referralCode || null,
        ambassadorId: ambassador._id.toString(),
        isAmbassador: true
      };
    }

    return NextResponse.json({ 
      valid: true, 
      discount: discountInfo
    })

  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json({ valid: false, error: 'Failed to validate promo code' }, { status: 500 })
  }
}
