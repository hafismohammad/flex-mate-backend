import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    const URI = process.env.MONGO_URI  || ''; 
    // const URI = 'mongodb://localhost:27017'
    try {
        await mongoose.connect(URI)
        
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.log('MongoDB connection error', error)
        process.exit(1);
    }
}


export  default connectDB

