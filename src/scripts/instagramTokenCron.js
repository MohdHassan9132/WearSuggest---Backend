import cron from "node-cron";
import axios from "axios";
import { Seller } from "../models/seller.model.js";

const refreshInstagramLongLivedToken = async (seller) => {
    const response = await axios.get(
        "https://graph.instagram.com/refresh_access_token",
        {
            params: {
                grant_type: "ig_refresh_token",
                access_token: seller.igAccessToken,
            },
        }
    );

    seller.igAccessToken = response.data.access_token;
    seller.igTokenExpiresAt = new Date(
        Date.now() + Number(response.data.expires_in || 0) * 1000
    );

    await seller.save({ validateBeforeSave: false });
};

const runInstagramTokenRefresh = async () => {
    try {
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const sellers = await Seller.find({
            instagramConnected: true,
            igAccessToken: { $exists: true, $ne: "" },
            igTokenExpiresAt: { $lte: sevenDaysFromNow },
        });

        for (const seller of sellers) {
            try {
                await refreshInstagramLongLivedToken(seller);
                console.log(
                    `Instagram token refreshed for seller: ${seller._id}`
                );
            } catch (error) {
                console.error(
                    `Instagram token refresh failed for seller: ${seller._id}`,
                    error.response?.data || error.message
                );
            }
        }
    } catch (error) {
        console.error(
            "Instagram token cron failed to run:",
            error.response?.data || error.message
        );
    }
};

const startInstagramTokenCron = () => {
    // This runs once every day at midnight.
    // As long as your backend server is running, node-cron keeps watching the time.
    cron.schedule("0 0 * * *", () => {
        console.log("Running Instagram token refresh cron...");
        runInstagramTokenRefresh();
    });

    console.log("Instagram token refresh cron started");
};

export { startInstagramTokenCron, runInstagramTokenRefresh };
