import mongoose, { Schema, model, models } from 'mongoose';

const categorySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  parent: {
    type: mongoose.Types.ObjectId,
    ref: 'Category'
  }
}, {
  timestamps: true
});

export const Category = models.Category || model('Category', categorySchema); 