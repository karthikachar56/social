import mongoose from 'mongoose';

let selectedKey = 'default';
let resolvedURI = 'mongodb://localhost:27017/eventhub';

if (process.env.MONGO_URI) {
  selectedKey = 'MONGO_URI';
  resolvedURI = process.env.MONGO_URI;
} else if (process.env.MONGODB_URI) {
  selectedKey = 'MONGODB_URI';
  resolvedURI = process.env.MONGODB_URI;
} else if (process.env.MONGO_URL) {
  selectedKey = 'MONGO_URL';
  resolvedURI = process.env.MONGO_URL;
} else if (process.env.MONGODB_URL) {
  selectedKey = 'MONGODB_URL';
  resolvedURI = process.env.MONGODB_URL;
} else if (process.env.DATABASE_URL) {
  selectedKey = 'DATABASE_URL';
  resolvedURI = process.env.DATABASE_URL;
}

const MONGO_URI = resolvedURI;
const hostName = resolvedURI.includes('@') ? resolvedURI.split('@')[1].split('/')[0] : 'localhost';

console.log('Database connection target key:', selectedKey);
console.log('Database connection host:', hostName);

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: 'eventhub',
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongooseInstance) => {
      console.log('Connected to MongoDB');
      return mongooseInstance;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

