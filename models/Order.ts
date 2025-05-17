import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      default: ''
    }
  },
  products: [{
    productId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    price: {
      type: Number,
      required: true
    },
    size: {
      type: String,
      required: true
    },
    color: String,
    image: String,
    inventoryUpdated: {
      type: Boolean,
      default: false
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'pending'
  },
  notes: String,
  orderDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cashOnDelivery', 'instaPay'],
    default: 'cashOnDelivery'
  },
  transactionScreenshot: {
    type: String,
    default: null
  },
  paymentVerified: {
    type: Boolean,
    default: null
  },
  ambassador: {
    ambassadorId: String,
    referralCode: String,
    couponCode: String,
    commissionRate: {
      type: Number,
      default: 50
    },
    commission: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    },
    paymentDate: Date
  },
  inventoryProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order; 