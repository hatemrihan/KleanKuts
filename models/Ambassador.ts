import mongoose, { Schema, Model } from 'mongoose';

export interface IAmbassador {
  name: string;
  email: string;
  userId: string;
  referralCode: string;
  referralLink: string;
  couponCode: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  referrals: number;
  orders: number;
  conversions: number;
  sales: number;
  earnings: number;
  paymentsPending: number;
  paymentsPaid: number;
  commissionRate: number;
}

const ambassadorSchema = new Schema<IAmbassador>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    userId: { type: String },
    referralCode: { type: String, required: true, unique: true },
    referralLink: { type: String, required: true },
    couponCode: { type: String, sparse: true, unique: true },
    status: { 
      type: String, 
      required: true, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    referrals: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    paymentsPending: { type: Number, default: 0 },
    paymentsPaid: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 50 } // Default 50% commission
  },
  { timestamps: true }
);

// Create or get the Ambassador model
const Ambassador = (mongoose.models.Ambassador as Model<IAmbassador>) || 
  mongoose.model<IAmbassador>('Ambassador', ambassadorSchema);

export default Ambassador;
