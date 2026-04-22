import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Seller } from "../models/seller.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const options = {
    httpOnly: true,
    secure: true,
};

const registerSeller = asyncHandler(async (req, res) => {
    const { name, email, password, contactNumber, source } = req.body;

    if (
        [name, email, password, contactNumber, source].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are mandatory");
    }

    if (!req.file) throw new ApiError(400, "Avatar image is required");

    const Email = email.toLowerCase();

    const existingSeller = await Seller.findOne({ email: Email });

    if (existingSeller) {
        throw new ApiError(409, "Seller with this email already exists!");
    }

    const avatar = await uploadOnCloudinary(req.file.path);

    if (!avatar) throw new ApiError(500, "Avatar upload failed");

    const seller = await Seller.create({
        name,
        email: Email,
        password,
        contactNumber,
        source,
        avatar: avatar.secure_url,
    });

    const createdSeller = await Seller.findById(seller._id).select(
        "-password -refreshToken"
    );

    if (!createdSeller) {
        throw new ApiError(
            500,
            "Something went wrong during registering new seller!"
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                createdSeller,
                "New seller registered successfully!"
            )
        );
});

const loginSeller = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || email.trim() === "") {
        throw new ApiError(400, "Email is required");
    }

    const Email = email.toLowerCase();

    const seller = await Seller.findOne({ email: Email });

    if (!seller) throw new ApiError(404, "Seller not found!");

    if (!password || password.trim() === "") {
        throw new ApiError(400, "Password is required");
    }

    const isPasswordValid = await seller.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, `Invalid Password for seller - ${Email}`);
    }

    const accessToken = await seller.generateAccessToken();
    const refreshToken = await seller.generateRefreshToken();

    seller.refreshToken = refreshToken;
    seller.save({ validateBeforeSave: false });

    const loggedInSeller = await Seller.findById(seller._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    seller: loggedInSeller,
                    accessToken,
                    refreshToken,
                },
                "Seller logged in successfully"
            )
        );
});

const logoutSeller = asyncHandler(async (req, res) => {
    await Seller.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Seller was logged out successfully! "));
});

const getCurrentSeller = asyncHandler(async (req, res) => {
    const currentSeller = req.user?.toObject();

    if (!currentSeller) throw new ApiError(404, "Seller not found");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                currentSeller,
                "Returned current seller successfully"
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request");

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    const seller = await Seller.findById(decodedToken._id);

    if (!seller) throw new ApiError(401, "Invalid Refresh Token!");

    if (!(incomingRefreshToken === seller.refreshToken)) {
        throw new ApiError(401, "Refresh Token Expired!");
    }

    const accessToken = seller.generateAccessToken();
    const refreshToken = seller.generateRefreshToken();

    seller.refreshToken = refreshToken;
    seller.save({ validateBeforeSave: false });

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access Token Refreshed Successfully"
            )
        );
});

export {
    registerSeller,
    loginSeller,
    logoutSeller,
    getCurrentSeller,
    refreshAccessToken,
};
