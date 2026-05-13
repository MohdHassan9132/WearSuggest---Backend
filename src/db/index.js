import mongoose from "mongoose";
import { env } from "../config/env.js";

const databaseConnection = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${env.DB_URL}/${env.DB_NAME}`);
        console.log("MongoDB connected successfully!");
    } catch (error) {
        throw new Error(`MongoDB failed to connect: ${error.message}`);
    
    }
};

export default databaseConnection;
