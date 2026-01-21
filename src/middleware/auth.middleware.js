import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const JWTVerify = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");


    /* The part after || is there incase the user is sending tokens as header from mobile phone, 
        Token general format: Bearer <token> - hence we did the replace to get the value of token*/

    if (!token) throw new ApiError(401, "Unauthorized Request!");

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(498, "Token Expired");
        }
        throw new ApiError(401, "Invalid Access Token");
    }

    if (!req.user) throw new ApiError(401, "Invalid Access Token!");

    next();
});
