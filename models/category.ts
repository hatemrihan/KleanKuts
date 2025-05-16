import mongoose, { Schema, Model } from 'mongoose';

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  headline?: string;
  subheadline?: string;
  displayOrder: number;
  isActive: boolean;
  parentId?: string;
  
  // Display options
  buttonText?: string;
  buttonLink?: string;
  
  // Layout options
  desktopLayout?: {
    imagePosition: 'left' | 'right' | 'center';
    textAlignment: 'left' | 'right' | 'center';
    description?: string;
  };
  
  mobileLayout?: {
    imagePosition: 'top' | 'bottom' | 'center';
    textAlignment: 'left' | 'right' | 'center';
    description?: string;
  };
  
  // Styling options
  customStyles?: {
    textColor?: string;
    backgroundColor?: string;
    overlayOpacity?: number;
  };
  
  // Images
  images?: {
    main?: string;  // Main image URL
    mobile?: string; // Mobile-specific image URL
    gallery?: string[]; // Additional gallery images (up to 3)
  };
  
  callToAction?: {
    text: string;
    link: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    headline: String,
    subheadline: String,
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    
    // Display options
    buttonText: String,
    buttonLink: String,
    
    // Layout options
    desktopLayout: {
      imagePosition: { type: String, enum: ['left', 'right', 'center'], default: 'right' },
      textAlignment: { type: String, enum: ['left', 'right', 'center'], default: 'left' },
      description: String
    },
    
    mobileLayout: {
      imagePosition: { type: String, enum: ['top', 'bottom', 'center'], default: 'top' },
      textAlignment: { type: String, enum: ['left', 'right', 'center'], default: 'center' },
      description: String
    },
    
    // Styling options
    customStyles: {
      textColor: String,
      backgroundColor: String,
      overlayOpacity: Number
    },
    
    // Images
    images: {
      main: String,
      mobile: String,
      gallery: [String]
    },
    
    callToAction: {
      text: String, 
      link: String
    }
  },
  { timestamps: true }
);

// Create or get the Category model
const Category = (mongoose.models.Category as Model<ICategory>) || 
  mongoose.model<ICategory>('Category', categorySchema);

export default Category; 