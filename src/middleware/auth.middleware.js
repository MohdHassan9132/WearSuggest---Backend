import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Seller } from "../models/seller.model.js";
import { env } from "../config/env.js";

const verifyTokenAndGetEntity = async (req) => {
    const token =
        req?.cookies?.accessToken ||
        req?.cookies?.sellerAccessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Unauthorized Request!");

    try {
        const decodedToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
        console.log(decodedToken);
        let authenticatedEntity;

        if (decodedToken?.role === "user") {
            authenticatedEntity = await User.findById(decodedToken?._id).select(
                "-password -refreshToken"
            );
        } else if (decodedToken?.role === "seller") {
            authenticatedEntity = await Seller.findById(
                decodedToken?._id
            ).select("-password -refreshToken");
        } else {
            throw new ApiError(401, "Invalid Access Token");
        }

        if (!authenticatedEntity) {
            throw new ApiError(401, "Invalid Access Token!");
        }

        req.user = authenticatedEntity;

        return decodedToken;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error.name === "TokenExpiredError") {
            throw new ApiError(498, "Token Expired");
        }
        throw new ApiError(401, "Invalid Access Token");
    }
};

const verifySellerTokenAndGetEntity = async (req) => {
    const token =
        req.cookies?.sellerAccessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Unauthorized Request!");

    try {
        const decodedToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

        if (decodedToken?.role !== "seller") {
            throw new ApiError(403, "Seller access only");
        }


        const authenticatedSeller = await Seller.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!authenticatedSeller) {
            throw new ApiError(401, "Invalid Access Token!");
        }

        req.user = authenticatedSeller;

        return decodedToken;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error.name === "TokenExpiredError") {
            throw new ApiError(498, "Token Expired");
        }
        throw new ApiError(401, "Invalid Access Token");
    }
};

export const JWTVerify = asyncHandler(async (req, res, next) => {
    /* The part after || is there incase the user is sending tokens as header from mobile phone, 
        Token general format: Bearer <token> - hence we did the replace to get the value of token*/

    req.auth = await verifyTokenAndGetEntity(req);

    next();
});

export const verifySeller = asyncHandler(async (req, res, next) => {
    const decodedToken = await verifySellerTokenAndGetEntity(req);

    req.auth = decodedToken;

    next();
});

export const verifyUser = asyncHandler(async (req, res, next) => {
    const decodedToken = req.auth || (await verifyTokenAndGetEntity(req));

    if (decodedToken?.role !== "user") {
        throw new ApiError(403, "User access only");
    }

    next();
});
