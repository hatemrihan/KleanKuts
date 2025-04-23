import mongoose, { Schema, Document } from 'mongoose';

interface IOrder extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  notes?: string;
  products: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    size: string;
    image: string;
    discount?: number;
  }>;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  apartment: { type: String, required: true },
  city: { type: String, required: true },
  notes: String,
  products: [{
    id: Number,
    name: String,
    price: Number,
    quantity: Number,
    size: String,
    image: String,
    discount: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  total: Number
}, {
  timestamps: true
});

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order; 