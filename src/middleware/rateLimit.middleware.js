import { rateLimit } from "express-rate-limit";

export const lifeTimeLimiter = function (timeInMilliseconds, requestsAllowed) {
    rateLimit({
        windowMs: timeInMilliseconds,
        max: requestsAllowed,
        message: "Too many requests, this IP is blocked permanently.",
        standardHeaders: true,
        legacyHeaders: false,
    });
};
