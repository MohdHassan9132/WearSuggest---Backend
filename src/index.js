import "dotenv/config";
import db_connection from "./db/index.js";
import { app } from "./app.js";
import { startInstagramTokenCron } from "./scripts/instagramTokenCron.js";

db_connection()
    .then(() => {
        startInstagramTokenCron();
        app.listen(process.env.PORT || 3000, () => {
            console.log(`The app is running on port: ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.error("ERROR: MongoDB connection failed!", error.message);
    });
