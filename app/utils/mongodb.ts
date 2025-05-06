import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kleankuts:kleankuts@cluster0.ckbmqvs.mongodb.net/kleankuts?retryWrites=true&w=majority';
const MONGODB_DB = process.env.MONGODB_DB || 'kleankuts';

// Cache the MongoDB connection to reuse it across requests
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  // If we have the cached connection, reuse it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // If no cached connection, create a new one
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!MONGODB_DB) {
    throw new Error('Please define the MONGODB_DB environment variable');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  // Cache the client and db for reuse
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
