import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

interface OrderProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image?: string;
  discount?: number;
}

interface OrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  notes?: string;
  products: OrderProduct[];
  total: number;
  status?: string;
}

export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Parse the request body
    const body = await req.json() as OrderData;

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.phone) {
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

    // Create the order with the exact schema structure
    const order = await Order.create({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      apartment: body.apartment,
      city: body.city,
      notes: body.notes,
      products: body.products,
      total: body.total,
      status: body.status || 'pending'
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