import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  console.log('Attempting to connect to MongoDB...');
  
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
    };

    try {
      console.log('Initializing new MongoDB connection...');
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      }).catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
    } catch (error) {
      console.error('Error initializing MongoDB connection:', error);
      throw error;
    }
  }

  try {
    console.log('Waiting for MongoDB connection promise to resolve...');
    cached.conn = await cached.promise;
    console.log('MongoDB connection established successfully');
  } catch (error) {
    console.error('Error awaiting MongoDB connection:', error);
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect; 