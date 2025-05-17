/**
 * MongoDB Migration Script
 * Fixes existing orders by adding missing payment fields
 * 
 * Usage:
 * 1. Make sure MongoDB connection string is set in .env
 * 2. Run: node scripts/fix-payment-status.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Order schema (simplified for the migration)
const orderSchema = new mongoose.Schema({
  paymentMethod: String,
  transactionScreenshot: String,
  paymentVerified: Boolean,
  status: String,
  products: [{ 
    productId: String,
    size: String,
    color: String,
    quantity: Number,
    inventoryUpdated: Boolean
  }],
  inventoryProcessed: Boolean
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// Migration functions
async function fixPaymentFields() {
  console.log('Starting payment fields migration...');
  
  try {
    // Update InstaPay orders without paymentVerified field
    const instapayResult = await Order.updateMany(
      { 
        paymentMethod: 'instaPay', 
        paymentVerified: { $exists: false }
      },
      { 
        $set: { paymentVerified: false }
      }
    );
    
    console.log(`Updated ${instapayResult.modifiedCount} InstaPay orders with missing paymentVerified field`);
    
    // Fix orders with missing paymentMethod
    const methodResult = await Order.updateMany(
      { 
        paymentMethod: { $exists: false }
      },
      { 
        $set: { paymentMethod: 'cashOnDelivery' }
      }
    );
    
    console.log(`Added default paymentMethod to ${methodResult.modifiedCount} orders`);
    
    // Initialize inventoryProcessed field for orders that don't have it
    const inventoryResult = await Order.updateMany(
      { 
        inventoryProcessed: { $exists: false }
      },
      { 
        $set: { inventoryProcessed: false }
      }
    );
    
    console.log(`Added inventoryProcessed field to ${inventoryResult.modifiedCount} orders`);
    
    // Initialize inventoryUpdated field for order products that don't have it
    const productsResult = await Order.updateMany(
      { 
        "products.inventoryUpdated": { $exists: false }
      },
      { 
        $set: { "products.$[].inventoryUpdated": false }
      }
    );
    
    console.log(`Added inventoryUpdated field to products in ${productsResult.modifiedCount} orders`);
    
    console.log('Payment fields migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run migrations
async function runMigrations() {
  await connectDB();
  await fixPaymentFields();
  
  // Close the database connection
  mongoose.connection.close();
  console.log('Database connection closed');
}

runMigrations(); 