import mongoose from 'mongoose';

let cached: Promise<typeof mongoose> | null = null;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in the backend environment');
  }

  if (mongoose.connection.readyState === 1) return mongoose;

  if (!cached) {
    cached = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
  }

  await cached;
  return mongoose;
}

