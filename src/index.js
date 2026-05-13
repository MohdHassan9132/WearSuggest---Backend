import "dotenv/config";
import db_connection from "./db/index.js";
import { app } from "./app.js";
import { startInstagramTokenCron } from "./scripts/instagramTokenCron.js";
import { env } from "./config/env.js";

db_connection()
    .then(() => {
        startInstagramTokenCron();
        app.listen(env.PORT || 3000, () => {
            console.log(`The app is running on port: ${env.PORT}`);
        });
    })
    .catch((error) => {
        console.error("ERROR: MongoDB connection failed!", error.message);
    });
