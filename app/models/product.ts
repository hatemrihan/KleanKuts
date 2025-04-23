import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, default: 1300 },
    selectedSizes: [String],
    gender: String,
    color: String,
    stock: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountType: String,
    selectedImages: [String],
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    deleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Product = mongoose.models?.Product || mongoose.model('Product', productSchema);

