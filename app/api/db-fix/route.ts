import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';

// This API endpoint is temporary - used to fix the database index issue
// It should be protected or removed after fixing the issue
export async function GET(request: NextRequest) {
  try {
    console.log('Starting database maintenance...');
    
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
      // 1. Check if the problematic index exists
      const indexes = await ambassadorCollection.indexes();
      console.log('Current indexes:', indexes);
      
      const referralCodeIndex = indexes.find(
        (idx: any) => idx.name === 'referralCode_1' || idx.key?.referralCode === 1
      );
      
      if (referralCodeIndex) {
        console.log('Found referralCode index, dropping it...');
        
        // 2. Drop the problematic index
        await ambassadorCollection.dropIndex('referralCode_1');
        console.log('Successfully dropped the index');
      } else {
        console.log('No problematic index found');
      }
      
      // 3. Create a new sparse index
      console.log('Creating new sparse index...');
      await ambassadorCollection.createIndex(
        { referralCode: 1 }, 
        { unique: true, sparse: true, name: 'referralCode_1_sparse' }
      );
      
      console.log('Successfully created new sparse index');
      
      // 4. Verify the new indexes
      const newIndexes = await ambassadorCollection.indexes();
      console.log('Updated indexes:', newIndexes);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database maintenance completed successfully',
        indexes: newIndexes
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
      error: 'Maintenance failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 