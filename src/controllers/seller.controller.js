import jwt from "jsonwebtoken";
import axios from "axios";
import crypto from "crypto";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Seller } from "../models/seller.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { cookieOptions, stateCookieOptions } from "../config/cookie.js";
import { env } from "../config/env.js";

// Helper function to log Instagram API errors consistently
const logInstagramError = (label, error) => {
    console.error(`🔴 [INSTAGRAM ERROR] ${label}:`);
    
    if (error.response) {
        // Instagram API responded with error
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Response Data:`, JSON.stringify(error.response.data, null, 2));
        console.error(`   Headers:`, error.response.headers);
    } else if (error.request) {
        // Request was made but no response received
        console.error(`   No response received from Instagram API`);
        console.error(`   Request:`, error.request);
    } else {
        // Something else happened
        console.error(`   Message: ${error.message}`);
    }
    
    console.error(`   Full Error:`, error);
};

const getFrontendBrandLoginUrl = (message = "") => {
    const loginUrl = new URL("/brand-login", env.FRONTEND_URL);

    if (message) {
        loginUrl.searchParams.set("instagram_error", message);
    }

    return loginUrl.toString();
};

const getFrontendBrandDashboardUrl = () => {
    const dashboardUrl = new URL("/brand-dashboard", env.FRONTEND_URL);
    dashboardUrl.searchParams.set("instagram", "connected");
    return dashboardUrl.toString();
};

const generateSellerTokens = async (seller) => {
    const accessToken = await seller.generateAccessToken();
    const refreshToken = await seller.generateRefreshToken();

    seller.refreshToken = refreshToken;
    await seller.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

const getInstagramTokenExpiryDate = (expiresIn) => {
    return new Date(Date.now() + Number(expiresIn || 0) * 1000);
};

const getInstagramAuthUrl = (state) => {
    const instagramAuthUrl = new URL("https://www.instagram.com/oauth/authorize");

    instagramAuthUrl.searchParams.set("client_id", env.INSTAGRAM_CLIENT_ID);
    instagramAuthUrl.searchParams.set(
        "redirect_uri",
        env.INSTAGRAM_REDIRECT_URI
    );
    instagramAuthUrl.searchParams.set("response_type", "code");
    instagramAuthUrl.searchParams.set("scope","instagram_business_basic");
    instagramAuthUrl.searchParams.set("force_reauth", "true");
    instagramAuthUrl.searchParams.set("state", state);

    return instagramAuthUrl.toString();
};

const exchangeCodeForShortLivedToken = async (code) => {
    console.log(`\n🟡 [1/5] exchangeCodeForShortLivedToken - START`);
    console.log(`   Using redirect_uri: ${env.INSTAGRAM_REDIRECT_URI}`);
    console.log(`   Using client_id: ${env.INSTAGRAM_CLIENT_ID?.slice(0, 8)}...`);
    console.log(`   Code first 12 chars: ${code?.slice(0, 12)}...`);
    
    try {
        const response = await axios.post(
            "https://api.instagram.com/oauth/access_token",
            new URLSearchParams({
                client_id: env.INSTAGRAM_CLIENT_ID,
                client_secret: env.INSTAGRAM_CLIENT_SECRET,
                grant_type: "authorization_code",
                redirect_uri: env.INSTAGRAM_REDIRECT_URI,
                code,
            }).toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        
        console.log(`✅ [1/5] exchangeCodeForShortLivedToken - SUCCESS`);
        console.log(`   Response has access_token: ${!!response.data.access_token}`);
        console.log(`   Token first 12 chars: ${response.data.access_token?.slice(0, 12)}...`);
        
        return response.data;
    } catch (error) {
        console.error(`❌ [1/5] exchangeCodeForShortLivedToken - FAILED`);
        logInstagramError("exchangeCodeForShortLivedToken", error);
        throw error;
    }
};

const exchangeShortLivedForLongLivedToken = async (shortLivedToken) => {
    console.log(`\n🟡 [2/5] exchangeShortLivedForLongLivedToken - START`);
    console.log(`   Short token first 12 chars: ${shortLivedToken?.slice(0, 12)}...`);
    
    try {
        const response = await axios.get("https://graph.instagram.com/access_token", {
            params: {
                grant_type: "ig_exchange_token",
                client_secret: env.INSTAGRAM_CLIENT_SECRET,
                access_token: shortLivedToken,
            },
        });
        
        console.log(`✅ [2/5] exchangeShortLivedForLongLivedToken - SUCCESS`);
        console.log(`   Long token first 12 chars: ${response.data.access_token?.slice(0, 12)}...`);
        console.log(`   Expires in: ${response.data.expires_in} seconds`);
        
        return response.data;
    } catch (error) {
        console.error(`❌ [2/5] exchangeShortLivedForLongLivedToken - FAILED`);
        logInstagramError("exchangeShortLivedForLongLivedToken", error);
        throw error;
    }
};

const getInstagramProfile = async (accessToken) => {
    console.log(`\n🟡 [3/5] getInstagramProfile - START`);
    console.log(`   Token first 12 chars: ${accessToken?.slice(0, 12)}...`);
    
    try {
        const response = await axios.get("https://graph.instagram.com/me", {
            params: {
                fields: "id,username",
                access_token: accessToken,
            },
        });
        
        console.log(`✅ [3/5] getInstagramProfile - SUCCESS`);
        console.log(`   Instagram ID: ${response.data.id}`);
        console.log(`   Instagram Username: ${response.data.username}`);
        
        return response.data;
    } catch (error) {
        console.error(`❌ [3/5] getInstagramProfile - FAILED`);
        logInstagramError("getInstagramProfile", error);
        throw error;
    }
};

const registerSeller = asyncHandler(async (req, res) => {
    const { name, email, password, contactNumber, source } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const Email = email.toLowerCase();

    const existingSeller = await Seller.findOne({ email: Email });

    if (existingSeller) {
        throw new ApiError(409, "Seller with this email already exists!");
    }

    let avatarUrl = "";

    if (req.file) {
        const avatar = await uploadOnCloudinary(req.file.path);
        avatarUrl = avatar?.secure_url || "";
    }

    const seller = await Seller.create({
        email: Email,
        password,
        name: name || "",
        contactNumber: contactNumber || "",
        source: source || "",
        avatar: avatarUrl,
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

    const { accessToken, refreshToken } = await generateSellerTokens(seller);

    const loggedInSeller = await Seller.findById(seller._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .cookie("sellerAccessToken", accessToken, cookieOptions)
        .cookie("sellerRefreshToken", refreshToken, cookieOptions)
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

const instagramLoginSeller = asyncHandler(async (req, res) => {
    console.log("\n🔵 [START] instagramLoginSeller - Initiating Instagram OAuth login");
    console.log("📋 Checking environment variables...");
    
    // Log environment variables status (but not full secrets)
    console.log(`   INSTAGRAM_CLIENT_ID exists: ${!!env.INSTAGRAM_CLIENT_ID}`);
    if (env.INSTAGRAM_CLIENT_ID) {
        console.log(`   INSTAGRAM_CLIENT_ID first 8 chars: ${env.INSTAGRAM_CLIENT_ID.slice(0, 8)}...`);
    }
    
    console.log(`   INSTAGRAM_CLIENT_SECRET exists: ${!!env.INSTAGRAM_CLIENT_SECRET}`);
    console.log(`   INSTAGRAM_REDIRECT_URI: ${env.INSTAGRAM_REDIRECT_URI}`);
    
    if (
        !env.INSTAGRAM_CLIENT_ID ||
        !env.INSTAGRAM_CLIENT_SECRET ||
        !env.INSTAGRAM_REDIRECT_URI
    ) {
        console.error("❌ Missing Instagram OAuth environment variables!");
        throw new ApiError(500, "Instagram OAuth env variables are missing");
    }

    const state = crypto.randomBytes(24).toString("hex");
    console.log(`🔐 Generated CSRF state token: ${state.slice(0, 12)}...`);

    const authUrl = getInstagramAuthUrl(state);
    console.log(`🌐 Generated Instagram OAuth URL: ${authUrl}`);
    
    // Log important URL parameters for debugging
    const urlObj = new URL(authUrl);
    console.log(`   Redirect URI in URL: ${urlObj.searchParams.get("redirect_uri")}`);
    console.log(`   Client ID in URL: ${urlObj.searchParams.get("client_id")?.slice(0, 8)}...`);
    console.log(`   Scopes in URL: ${urlObj.searchParams.get("scope")}`);
    console.log(`   State in URL: ${urlObj.searchParams.get("state")?.slice(0, 12)}...`);

    // This state value helps block CSRF by making sure the callback
    // belongs to the same login request we started here.
    console.log("🍪 Setting instagramOAuthState cookie and redirecting...");
    return res
        .cookie("instagramOAuthState", state, stateCookieOptions)
        .redirect(authUrl);
});

const instagramCallbackSeller = asyncHandler(async (req, res) => {
    console.log("\n🔵 [START] instagramCallbackSeller - Processing Instagram OAuth callback");
    console.log("📋 Full request query parameters:", JSON.stringify(req.query, null, 2));
    console.log("🍪 Request cookies:", Object.keys(req.cookies));
    console.log(`   instagramOAuthState cookie exists: ${!!req.cookies.instagramOAuthState}`);
    
    const { code, state, error, error_reason, error_description } = req.query;
    const savedState = req.cookies.instagramOAuthState;
    
    console.log(`🔑 Code received: ${code ? `Yes (first 12 chars: ${code.slice(0, 12)}...)` : "NO"}`);
    console.log(`🔐 State from query: ${state ? state.slice(0, 12) + "..." : "not provided"}`);
    console.log(`🔐 Saved state from cookie: ${savedState ? savedState.slice(0, 12) + "..." : "not found"}`);

    // Check for Instagram OAuth errors first
    if (error) {
        console.error(`❌ Instagram returned error parameter: ${error}`);
        console.error(`   Error reason: ${error_reason}`);
        console.error(`   Error description: ${error_description}`);
        const message = error_description || error_reason || error;
        console.log(`🔄 Redirecting to brand login with error: ${message}`);
        return res.redirect(getFrontendBrandLoginUrl(message));
    }

    if (!code) {
        console.error("❌ No authorization code received from Instagram!");
        console.log(`🔄 Redirecting to brand login with missing code error`);
        return res.redirect(getFrontendBrandLoginUrl("Instagram login code is missing"));
    }

    console.log(`✅ Authorization code received successfully`);
    
    // If state does not match, we stop here because the callback
    // could have been triggered from some other site or old request.
    console.log("🛡️ Validating CSRF state token...");
    const stateMatches = state && savedState && state === savedState;
    console.log(`   State matches: ${stateMatches}`);
    
    if (!stateMatches) {
        console.error("❌ CSRF state validation failed!");
        console.error(`   Query state: ${state}`);
        console.error(`   Cookie state: ${savedState}`);
        console.log(`🔄 Redirecting to brand login with invalid state error`);
        return res
            .clearCookie("instagramOAuthState", stateCookieOptions)
            .redirect(getFrontendBrandLoginUrl("Instagram login state is invalid"));
    }
    
    console.log("✅ CSRF state validation passed");

    try {
        console.log("\n🚀 Starting token exchange and profile fetch sequence...");
        
        // Step 1: Exchange code for short-lived token
        console.log("📡 [Step 1/3] Exchanging code for short-lived token...");
        const shortLivedTokenData = await exchangeCodeForShortLivedToken(code);
        
        // Step 2: Exchange short-lived for long-lived token
        console.log("📡 [Step 2/3] Exchanging short-lived token for long-lived token...");
        const longLivedTokenData = await exchangeShortLivedForLongLivedToken(
            shortLivedTokenData.access_token
        );
        
        // Step 3: Get Instagram profile
        console.log("📡 [Step 3/3] Fetching Instagram profile...");
        const instagramProfile = await getInstagramProfile(
            longLivedTokenData.access_token
        );
        
        console.log("\n👤 Instagram profile retrieved successfully:");
        console.log(`   ID: ${instagramProfile.id}`);
        console.log(`   Username: ${instagramProfile.username}`);

        // Check if seller already exists
        console.log("\n🔍 Looking for existing seller with instagramId:", instagramProfile.id);
        let seller = await Seller.findOne({
            instagramId: instagramProfile.id,
        });
        
        console.log(`   Existing seller found: ${!!seller}`);

        const instagramSellerData = {
            instagramId: instagramProfile.id,
            instagramUsername: instagramProfile.username,
            igAccessToken: longLivedTokenData.access_token,
            igTokenExpiresAt: getInstagramTokenExpiryDate(
                longLivedTokenData.expires_in
            ),
            instagramConnected: true,
        };
        
        console.log(`📅 Token expires at: ${instagramSellerData.igTokenExpiresAt}`);

        if (seller) {
            console.log("✏️ Updating existing seller with Instagram data...");
            seller.instagramId = instagramSellerData.instagramId;
            seller.instagramUsername = instagramSellerData.instagramUsername;
            seller.igAccessToken = instagramSellerData.igAccessToken;
            seller.igTokenExpiresAt = instagramSellerData.igTokenExpiresAt;
            seller.instagramConnected = instagramSellerData.instagramConnected;
            await seller.save({ validateBeforeSave: false });
            console.log("✅ Seller updated successfully");
        } else {
            console.log("📝 Creating new seller from Instagram data...");
            seller = await Seller.create({
                name: instagramProfile.username,
                source: "instagram",
                ...instagramSellerData,
            });
            console.log(`✅ New seller created with ID: ${seller._id}`);
        }

        console.log("\n🎫 Generating JWT tokens for seller...");
        const { accessToken, refreshToken } = await generateSellerTokens(seller);
        console.log("✅ JWT tokens generated successfully");

        console.log("🍪 Clearing OAuth state cookie, setting auth cookies, and redirecting to dashboard...");
        return res
            .clearCookie("instagramOAuthState", stateCookieOptions)
            .cookie("sellerAccessToken", accessToken, cookieOptions)
            .cookie("sellerRefreshToken", refreshToken, cookieOptions)
            .redirect(getFrontendBrandDashboardUrl());
            
    } catch (instagramError) {
        console.error("\n💥 [ERROR] Instagram OAuth flow failed!");
        logInstagramError("instagramCallbackSeller", instagramError);
        
        const message =
            instagramError.response?.data?.error_message ||
            instagramError.response?.data?.error?.message ||
            instagramError.message ||
            "Instagram login failed";
        
        console.log(`🔄 Redirecting to brand login with error message: ${message}`);
        return res
            .clearCookie("instagramOAuthState", stateCookieOptions)
            .redirect(getFrontendBrandLoginUrl(message));
    }
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
        .clearCookie("sellerAccessToken", cookieOptions)
        .clearCookie("sellerRefreshToken", cookieOptions)
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
        req?.cookies?.sellerRefreshToken || req?.body?.refreshToken;

    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request");

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        env.REFRESH_TOKEN_SECRET
    );

    const seller = await Seller.findById(decodedToken._id);

    if (!seller) throw new ApiError(401, "Invalid Refresh Token!");

    if (!(incomingRefreshToken === seller.refreshToken)) {
        throw new ApiError(401, "Refresh Token Expired!");
    }

    const accessToken = seller.generateAccessToken();
    const refreshToken = seller.generateRefreshToken();

    seller.refreshToken = refreshToken;
    await seller.save({ validateBeforeSave: false });

    return res
        .status(200)
        .cookie("sellerAccessToken", accessToken, cookieOptions)
        .cookie("sellerRefreshToken", refreshToken, cookieOptions)
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
    instagramLoginSeller,
    instagramCallbackSeller,
    logoutSeller,
    getCurrentSeller,
    refreshAccessToken,
};
