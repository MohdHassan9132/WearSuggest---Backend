// import dotenv from "dotenv";
// dotenv.config();
import db_connection from "./db/index.js";
import { app } from "./app.js";

db_connection()
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log(`The app is running on port: ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.error("ERROR: MongoDB connection failed!", error.message);
    });
