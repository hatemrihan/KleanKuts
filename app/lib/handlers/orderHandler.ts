import dbConnect from "../mongodb";
import Order from "../../../models/Order";
import mongoose from "mongoose";

export async function getOrders() {
  try {
    console.log('Connecting to MongoDB...');
    await dbConnect();
    console.log('Connected successfully, fetching orders...');
    
    // First try to get all orders without population
    const ordersCount = await Order.countDocuments();
    console.log(`Found ${ordersCount} orders in database`);
    
    // Get all orders with basic fields
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'products',
        model: 'Product',
        select: 'title price'
      });
    
    console.log(`Successfully fetched ${orders.length} orders with populated products`);
    console.log('Sample order:', orders[0]);
    return orders;
  } catch (error: any) {
    console.error('Error in getOrders:', error);
    console.error('Full error details:', error);
    if (error.name === 'MissingSchemaError') {
      console.error('Available models:', Object.keys(mongoose.models));
    }
    throw new Error(error.message || 'Failed to fetch orders');
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    await dbConnect();
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate('products');
    
    if (!updatedOrder) {
      throw new Error('Order not found');
    }
    
    return updatedOrder;
  } catch (error: any) {
    console.error('Error updating order status:', error);
    throw new Error(error.message || 'Failed to update order status');
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await dbConnect();
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      throw new Error('Order not found');
    }
    return deletedOrder;
  } catch (error: any) {
    console.error('Error deleting order:', error);
    throw new Error(error.message || 'Failed to delete order');
  }
} 