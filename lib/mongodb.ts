import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    try {
        console.log('Establishing new MongoDB connection...');
        await mongoose.connect(MONGODB_URI as string, {
            bufferCommands: false,
            family: 4,
            serverSelectionTimeoutMS: 5000,
        });
        console.log('Successfully connected to MongoDB.');
        return mongoose.connection;
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        throw error;
    }
}

export default connectToDatabase;
