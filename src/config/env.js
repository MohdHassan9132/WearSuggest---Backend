const enviroment = process.env.NODE_ENV
export const env = {
    PORT: process.env.PORT,

    NODE_ENV: enviroment,

    FRONTEND_URL: process.env.FRONTEND_URL,

    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,

    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,

    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,

    INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID
    ,
    INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,

    INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,

    INSTAGRAM_CHILD_STATUS_POLL_INTERVAL_MS:
        process.env.INSTAGRAM_CHILD_STATUS_POLL_INTERVAL_MS,
    INSTAGRAM_CHILD_STATUS_POLL_MAX_RETRIES:
        process.env.INSTAGRAM_CHILD_STATUS_POLL_MAX_RETRIES,
    INSTAGRAM_PUBLISH_STATUS_POLL_INTERVAL_MS:
        process.env.INSTAGRAM_PUBLISH_STATUS_POLL_INTERVAL_MS,
    INSTAGRAM_PUBLISH_STATUS_POLL_MAX_RETRIES:
        process.env.INSTAGRAM_PUBLISH_STATUS_POLL_MAX_RETRIES,
    
    DB_URL: enviroment === "production"? process.env.LIVE_DB_URL : process.env.TEST_DB_URL ,

    DB_NAME: process.env.DB_NAME,

    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    CLOUDINARY: enviroment === "production" ? {
        CLOUD_NAME: process.env.CLOUDINARY_LIVE_CLOUD_NAME,
        API_KEY: process.env.CLOUDINARY_LIVE_KEY,
        API_SECRET: process.env.CLOUDINARY_LIVE_SECRET,
    }:{
        CLOUD_NAME: process.env.CLOUDINARY_TEST_CLOUD_NAME,
        API_KEY: process.env.CLOUDINARY_TEST_KEY,
        API_SECRET: process.env.CLOUDINARY_TEST_SECRET
    },
    RAZORPAY: enviroment === "production" ? {
        ID: process.env.RAZORPAY_LIVE_ID,
        SECRET: process.env.RAZORPAY_LIVE_SECRET,
        WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET
    }:{
        ID: process.env.RAZORPAY_TEST_ID,
        SECRET: process.env.RAZORPAY_TEST_SECRET,
        WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET
    },
    FASHN_API_KEY:process.env.FASHN_API_KEY,
    BLACK_AI_KEY:process.env.BLACK_AI_KEY
};
