import mongoose, { Schema, Document } from 'mongoose';

interface IOrder extends Document {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  products: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    image?: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema({
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  products: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    size: { type: String, required: true },
    image: String
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  orderDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order; 