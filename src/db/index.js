import mongoose from "mongoose";

const databaseConnection = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.DB_URL}/${process.env.DB_NAME}`
        );

        console.log("MongoDB connected successfully!");
    } catch (error) {
        throw new Error(`MongoDB failed to connect: ${error.message}`);
    
    }
};

export default databaseConnection;
