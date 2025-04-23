// Set MongoDB URI
process.env.MONGODB_URI = "mongodb+srv://kenzyStore:kenzy123@cluster0.a8wvo7h.mongodb.net/kenzy?retryWrites=true&w=majority";

import dbConnect from '../lib/mongodb';
import Product from '../models/Product';

const products = [
  {
    name: '01 Sage set in Rich brown',
    price: 1200,
    images: ['/images/model-image.jpg'],
    discount: 0
  },
  {
    name: '02 Sage set in light beige',
    price: 1200,
    images: ['/images/modelfive-image.jpg'],
    discount: 0
  },
  {
    name: 'Sage top in Rich brown',
    price: 800,
    images: ['/images/modeleight-image.jpg'],
    discount: 25
  },
  {
    name: 'Sage top in light beige',
    price: 800,
    images: ['/images/malak-image.jpg'],
    discount: 25
  },
  {
    name: 'Sage pants in rich brown',
    price: 800,
    images: ['/images/malakfour-image.jpg'],
    discount: 25
  },
  {
    name: 'Sage pants in light beige',
    price: 800,
    images: ['/images/malakandmodel-image.jpg'],
    discount: 25
  }
];

async function seedProducts() {
  try {
    await dbConnect();
    
    // Clear existing products
    await Product.deleteMany({});
    
    // Insert new products
    const result = await Product.insertMany(products);
    
    console.log('Successfully seeded products:', result);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts(); 