import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Ambassador from '@/models/Ambassador'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    // Connect to MongoDB
    await dbConnect()
    
    const ambassador = await Ambassador.findOne({ email })

    if (!ambassador) {
      return NextResponse.json({ status: 'none' })
    }

    return NextResponse.json({ status: ambassador.status })
  } catch (error) {
    console.error('Error checking ambassador status:', error)
    return NextResponse.json({ error: 'Failed to check ambassador status' }, { status: 500 })
  }
}
