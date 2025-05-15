import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

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

// Drop existing indexes to prevent conflicts
// This will recreate the schema from scratch
try {
  if (mongoose.models.Ambassador) {
    delete mongoose.models.Ambassador;
  }
} catch (error) {
  console.error('Error resetting Ambassador model:', error);
}

const ambassadorSchema = new Schema<IAmbassador>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    userId: { type: String },
    // We'll generate the referral code internally, so it's always set
    referralCode: { 
      type: String,
      default: function() {
        // Generate a guaranteed unique code using uuid
        return `elv_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
      },
      index: {
        unique: true,
        sparse: true,
        name: 'referralCode_1_sparse'
      }
    },
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

// Always ensure referralLink is set based on the referralCode
ambassadorSchema.pre('save', function(next) {
  const mainSiteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elevee.netlify.app';
  this.referralLink = `${mainSiteUrl}?ref=${this.referralCode}`;
  next();
});

// Create or get the Ambassador model
const Ambassador = (mongoose.models.Ambassador as Model<IAmbassador>) || 
  mongoose.model<IAmbassador>('Ambassador', ambassadorSchema);

export default Ambassador;
