import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

// This API endpoint is temporary - used to fix ambassador documents with null referral codes
export async function GET(request: NextRequest) {
  try {
    console.log('Starting data repair...');
    
    // Connect to the database
    await dbConnect();
    console.log('Connected to MongoDB');
    
    // Get a direct connection to the collection
    const db = mongoose.connection.db;
    if (!db) {
      console.error('Database connection not initialized');
      return NextResponse.json({ error: 'Database connection not initialized' }, { status: 500 });
    }
    
    const ambassadorCollection = db.collection('ambassadors');
    
    try {
      // Find all ambassador documents with null referral codes
      const nullReferralDocs = await ambassadorCollection.find({ 
        $or: [
          { referralCode: null },
          { referralCode: { $exists: false } },
          { referralCode: "" }
        ]
      }).toArray();
      
      console.log(`Found ${nullReferralDocs.length} ambassadors with null or missing referral codes`);
      
      // Fix each document with a new unique code
      const results = [];
      for (const doc of nullReferralDocs) {
        const newCode = `elv_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
        
        // Update the document
        const updateResult = await ambassadorCollection.updateOne(
          { _id: doc._id },
          { 
            $set: { 
              referralCode: newCode,
              referralLink: `https://elevee.netlify.app?ref=${newCode}`
            } 
          }
        );
        
        results.push({
          id: doc._id,
          oldCode: doc.referralCode,
          newCode: newCode,
          updated: updateResult.modifiedCount > 0
        });
        
        console.log(`Updated ambassador ${doc._id} with new code: ${newCode}`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Fixed ${results.length} ambassador records`,
        results
      });
      
    } catch (dbError) {
      console.error('Error during database operation:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed', 
        details: dbError instanceof Error ? dbError.message : 'Unknown error' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Main error:', error);
    return NextResponse.json({ 
      error: 'Data repair failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 