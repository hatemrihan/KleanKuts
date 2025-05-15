import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  // Additional content fields that only admin can modify
  materials: {
    type: [String],
    default: [],
  },
  sizeGuide: {
    type: String, 
    default: '',
  },
  packaging: {
    type: String,
    default: '',
  },
  shippingReturns: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
  },
  selectedImages: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length > 0; // At least one image is required
      },
      message: 'At least one image is required'
    }
  },
  selectedSizes: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length > 0; // At least one size is required
      },
      message: 'At least one size is required'
    }
  },
  categories: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length > 0; // At least one category is required
      },
      message: 'At least one category is required'
    }
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  color: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: ''
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product; 