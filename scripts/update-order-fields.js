/**
 * MongoDB Fix Script for Order Fields
 * 
 * 1. Fixes payment method discrepancies between MongoDB and admin panel
 * 2. Updates inventoryUpdated field for items in orders with inventoryProcessed=true
 * 
 * Usage: node scripts/update-order-fields.js
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

// Simplified Order schema for the migration
const orderSchema = new mongoose.Schema({
  paymentMethod: String,
  transactionScreenshot: String,
  products: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number,
    size: String,
    color: String,
    inventoryUpdated: Boolean
  }],
  inventoryProcessed: Boolean
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// Fix function for payment methods
async function fixPaymentMethods() {
  console.log('Starting payment method fix');
  
  try {
    // Find orders with 'instaPay' payment method
    const instapayOrders = await Order.find({
      paymentMethod: 'instaPay'
    });
    
    console.log(`Found ${instapayOrders.length} InstaPay orders`);
    
    // Loop through each InstaPay order
    for (const order of instapayOrders) {
      // Make sure paymentMethod is consistently cased as "instaPay"
      if (order.paymentMethod !== 'instaPay') {
        order.paymentMethod = 'instaPay';
        await order.save();
        console.log(`Fixed payment method for order ${order._id}`);
      }
    }
    
    console.log('Payment method fix completed');
  } catch (error) {
    console.error('Error fixing payment methods:', error);
  }
}

// Fix function for inventory fields
async function fixInventoryFields() {
  console.log('Starting inventory fields fix');
  
  try {
    // Find all orders where inventoryProcessed is true but some product items have inventoryUpdated=false
    const orders = await Order.find({
      inventoryProcessed: true,
      'products.inventoryUpdated': false
    });
    
    console.log(`Found ${orders.length} orders with mismatched inventory status`);
    
    // Loop through each order and update all product items
    for (const order of orders) {
      let updatedItems = 0;
      
      // Update each product item
      for (const product of order.products) {
        if (product.inventoryUpdated === false) {
          product.inventoryUpdated = true;
          updatedItems++;
        }
      }
      
      if (updatedItems > 0) {
        await order.save();
        console.log(`Updated ${updatedItems} items in order ${order._id}`);
      }
    }
    
    console.log('Inventory fields fix completed');
  } catch (error) {
    console.error('Error fixing inventory fields:', error);
  }
}

// Run the fix functions
async function runFixes() {
  await connectDB();
  
  // Fix payment methods
  await fixPaymentMethods();
  
  // Fix inventory fields
  await fixInventoryFields();
  
  // Close the database connection
  mongoose.connection.close();
  console.log('Database connection closed');
}

runFixes(); 