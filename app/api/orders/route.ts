import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Ambassador from '@/models/Ambassador';

interface OrderProduct {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface OrderData {
  customer: CustomerInfo;
  products: OrderProduct[];
  totalAmount: number;
  status?: string;
  notes?: string;
  orderDate?: string;
  couponCode?: string;
  paymentMethod?: 'cashOnDelivery' | 'instaPay';
  transactionScreenshot?: string;
  paymentVerified?: boolean;
  ambassador?: {
    ambassadorId?: string;
    referralCode?: string;
    couponCode?: string;
    commissionRate?: number;
    commission?: number;
  };
}

export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Parse the request body
    const body = await req.json() as OrderData;

    // Validate required fields
    if (!body.customer?.name || !body.customer?.email || !body.customer?.phone) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required customer information'
        },
        { status: 400 }
      );
    }

    if (!body.products || !body.products.length) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No products in order'
        },
        { status: 400 }
      );
    }

    // Validate paymentMethod and transactionScreenshot
    if (body.paymentMethod === 'instaPay' && !body.transactionScreenshot) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Transaction screenshot is required for InstaPay orders'
        },
        { status: 400 }
      );
    }

    // Check if there's an ambassador coupon code provided
    let ambassadorData = null;
    if (body.couponCode) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://elevee.netlify.app'}/api/coupon/validate?code=${encodeURIComponent(body.couponCode)}`);
        const couponValidation = await response.json();
        
        if (couponValidation.success && couponValidation.valid) {
          // Calculate ambassador commission
          const commissionRate = couponValidation.commissionRate || 50;
          const commission = (body.totalAmount * (commissionRate / 100)).toFixed(2);
          
          ambassadorData = {
            ambassadorId: couponValidation.ambassadorId,
            referralCode: couponValidation.referralCode,
            couponCode: body.couponCode,
            commissionRate: commissionRate,
            commission: parseFloat(commission),
            paymentStatus: 'pending'
          };
          
          // Update ambassador statistics
          await updateAmbassadorStats(couponValidation.ambassadorId, parseFloat(commission), body.totalAmount);
        }
      } catch (error) {
        console.error('Error validating coupon code:', error);
        // Continue with order creation even if coupon validation fails
      }
    }

    // Create the order with the exact schema structure
    const order = await Order.create({
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        address: body.customer.address || ''
      },
      products: body.products.map(product => ({
        productId: product.productId,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        size: product.size,
        image: product.image
      })),
      totalAmount: body.totalAmount,
      status: body.status || 'pending',
      notes: body.notes || '',
      orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
      paymentMethod: body.paymentMethod || 'cashOnDelivery',
      transactionScreenshot: body.transactionScreenshot || null,
      paymentVerified: body.paymentMethod === 'instaPay' ? false : null,
      ambassador: ambassadorData // Add ambassador data if a valid coupon was used
    });

    // Return success response
    return NextResponse.json({ 
      success: true, 
      order: order,
      message: 'Order placed successfully.'
    });

  } catch (error: any) {
    console.error('Order creation error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid order data',
          details: Object.values(error.errors).map((err: any) => err.message)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create order. Please try again.'
      },
      { status: 500 }
    );
  }
}

// Add GET route to fetch orders
// Helper function to update ambassador statistics when an order is placed with their coupon code
async function updateAmbassadorStats(ambassadorId: string, commission: number, orderTotal: number) {
  try {
    const ambassador = await Ambassador.findById(ambassadorId);
    if (!ambassador) return;
    
    // Update statistics
    ambassador.orders += 1;
    ambassador.sales += orderTotal;
    ambassador.earnings += commission;
    ambassador.paymentsPending += commission;
    
    await ambassador.save();
    console.log(`Updated ambassador stats for ${ambassador.name}`);
  } catch (error) {
    console.error('Error updating ambassador stats:', error);
  }
}

export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 