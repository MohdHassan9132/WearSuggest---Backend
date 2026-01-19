import mongoose from "mongoose";

const databaseConnection = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.DB_URL}/${process.env.DB_NAME}`
        );

        console.log("MongoDB connected successfully!");
        console.log("DB Name: ", connectionInstance.connection.name);
        console.log("Host: ", connectionInstance.connection.host);
        console.log("Port Number: ", connectionInstance.connection.port);
    } catch (error) {
        throw new Error(`MongoDB failed to connect: ${error.message}`);
        process.exit(1);
    }
};

export default databaseConnection;
