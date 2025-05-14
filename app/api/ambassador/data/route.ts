import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/app/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import mongoose from 'mongoose'

// Define interfaces for our data models
interface IAmbassador {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  status: string;
  sales: number;
  earnings: number;
  paymentsPending: number;
  paymentsPaid: number;
  referralCode: string;
  couponCode: string;
  referralLink?: string;
  referrals?: number;
  orders?: number;
  conversions?: number;
  __v?: number;
}

interface IOrder {
  _id: mongoose.Types.ObjectId;
  referralCode: string;
  couponCode: string;
  createdAt: Date;
  total: number;
  commission: number;
  paymentStatus: string;
  __v?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const url = new URL(request.url)
    const email = url.searchParams.get('email') || session.user?.email
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    // Make sure the email in the request matches the authenticated user's email
    // Unless the user is an admin (you'd implement admin check here)
    if (email !== session.user?.email) {
      // Check if user is admin (implement your admin check logic here)
      const isAdmin = await checkIfUserIsAdmin(session.user?.email || '')
      
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    await dbConnect()
    
    // Using Mongoose to query the database
    const Ambassador = mongoose.models.Ambassador || mongoose.model('Ambassador', new mongoose.Schema({
      email: String,
      name: String,
      status: String,
      sales: Number,
      earnings: Number,
      paymentsPending: Number,
      paymentsPaid: Number,
      referralCode: String,
      couponCode: String
    }, { collection: 'ambassadors' }))

    const ambassador = await Ambassador.findOne({ email }).lean() as IAmbassador | null

    if (!ambassador) {
      return NextResponse.json({ error: 'Ambassador not found' }, { status: 404 })
    }

    if (ambassador.status !== 'approved') {
      return NextResponse.json({ error: 'Ambassador not approved yet' }, { status: 403 })
    }

    // Get recent orders associated with this ambassador
    const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({
      referralCode: String,
      couponCode: String,
      createdAt: Date,
      total: Number,
      commission: Number,
      paymentStatus: String
    }, { collection: 'orders' }))
    
    const recentOrders = await Order.find({ 
      $or: [
        { referralCode: ambassador.referralCode },
        { couponCode: ambassador.couponCode }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean() as IOrder[]

    // Transform orders to protect customer privacy
    const safeOrders = recentOrders.map(order => ({
      orderId: order._id.toString(),
      date: order.createdAt,
      amount: order.total,
      commission: order.commission,
      status: order.paymentStatus
    }))

    // Prepare and return the ambassador data
    return NextResponse.json({
      referralLink: ambassador.referralLink,
      couponCode: ambassador.couponCode,
      status: ambassador.status,
      referrals: ambassador.referrals,
      orders: ambassador.orders,
      conversions: ambassador.conversions,
      sales: ambassador.sales,
      earnings: ambassador.earnings,
      paymentsPending: ambassador.paymentsPending,
      paymentsPaid: ambassador.paymentsPaid,
      recentOrders: safeOrders
    })
    
  } catch (error) {
    console.error('Error fetching ambassador data:', error)
    return NextResponse.json({ error: 'Failed to fetch ambassador data' }, { status: 500 })
  }
}

// Helper function to check if a user is an admin
async function checkIfUserIsAdmin(email: string): Promise<boolean> {
  try {
    await dbConnect()
    
    const Admin = mongoose.models.Admin || mongoose.model('Admin', new mongoose.Schema({
      email: String
    }, { collection: 'admins' }))
    
    const admin = await Admin.findOne({ email }).lean()
    return !!admin
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}
