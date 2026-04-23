import { rateLimit } from "express-rate-limit";

export const rateLimiter = function (timeInMilliseconds, requestsAllowed) {
    return rateLimit({
        windowMs: timeInMilliseconds,
        max: requestsAllowed,
        message: "Too many requests, this IP is blocked permanently.",
        standardHeaders: true,
        legacyHeaders: false,
    });
};
