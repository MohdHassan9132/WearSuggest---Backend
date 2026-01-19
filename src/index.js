import dotenv from "dotenv";
dotenv.config();
import db_connection from "./db/index.js";
import { app } from "./app.js";

console.log(`DB_URL is: ${process.env.DB_URL}`);
db_connection()
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log(`The app is running on port: ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.error("ERROR: MongoDB connection failed!", error.message);
    });
