import "dotenv/config";
import db_connection from "./db/index.js";
import { app } from "./app.js";
import { startInstagramTokenCron } from "./scripts/instagramTokenCron.js";
import { env } from "./config/env.js";
import { startInstagramPublishWorker } from "../src/workers/instagramPublish.worker.js";

db_connection()
    .then(() => {
        startInstagramTokenCron();
        startInstagramPublishWorker().catch((error) => {
            console.error("ERROR: Instagram publish worker failed to start!", error);
        });
        app.listen(env.PORT || 3000, () => {
            console.log(`The app is running on port: ${env.PORT}`);
        });
    })
    .catch((error) => {
        console.error("ERROR: MongoDB connection failed!", error.message);
    });
