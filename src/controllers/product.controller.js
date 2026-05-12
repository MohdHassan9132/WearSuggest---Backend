import mongoose from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { generateClothingMetadata } from "../services/ai/tagging.service.js";
import { COLOR_GROUP_MAP } from "../constants/colors.js";
import fs from "fs";

const parseFitData = (fitData) => {
    if (typeof fitData === "string") {
        try {
            return JSON.parse(fitData);
        } catch (error) {
            throw new ApiError(400, "Invalid fitData format");
        }
    }

    return fitData;
};

const parseSeason = (season) => {
    if (typeof season === "string") {
        try {
            const parsed = JSON.parse(season);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            throw new ApiError(400, "Season must be an array");
        } catch (error) {
            throw new ApiError(400, "Invalid season format");
        }
    }
    
    if (Array.isArray(season)) {
        return season;
    }
    
    if (typeof season === "undefined") return undefined;
    
    throw new ApiError(400, "Season must be an array");
};

const parseBoolean = (value, fieldName) => {
    if (typeof value === "undefined") return undefined;
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;

    throw new ApiError(400, `${fieldName} must be a boolean value`);
};

const parseIsActive = (isActive) => {
    return parseBoolean(isActive, "isActive");
};

const parseIsPublished = (isPublished) => {
    return parseBoolean(isPublished, "isPublished");
};

const ANALYZE_TYPE_MAP = {
    top: "upper",
    bottom: "lower",
    outerwear: "outerwear",
    footwear: "footwear",
};

const normalizeAnalyzedProductType = (type) => {
    const normalizedType = ANALYZE_TYPE_MAP[type];

    if (!normalizedType) {
        throw new ApiError(400, `Unsupported analyzed product type: ${type}`);
    }

    return normalizedType;
};

const productVisibilityQuery = {
    isActive: true,
    $or: [{ isPublished: true }, { isPublished: { $exists: false } }],
};

const validateFitData = (type, fitData) => {
    if (!fitData || typeof fitData !== "object") {
        throw new ApiError(400, "fitData is required");
    }

    const hasUpperSection = typeof fitData.upper !== "undefined";
    const hasLowerSection = typeof fitData.lower !== "undefined";
    const hasFootwearSection = typeof fitData.footwear !== "undefined";
    const hasUpper =
        fitData.upper &&
        Object.values(fitData.upper).some((value) => value !== undefined && value !== null);
    const hasLower =
        fitData.lower &&
        Object.values(fitData.lower).some((value) => value !== undefined && value !== null);
    const hasFootwear =
        fitData.footwear &&
        fitData.footwear.size !== undefined &&
        fitData.footwear.size !== null;

    if ([hasUpper, hasLower, hasFootwear].filter(Boolean).length > 1) {
        throw new ApiError(
            400,
            "Only one of fitData.upper, fitData.lower, or fitData.footwear can be sent"
        );
    }

    if (type === "upper") {
        if (!hasUpper) {
            throw new ApiError(
                400,
                "For type 'upper', only fitData.upper is allowed"
            );
        }

        if (hasLowerSection || hasFootwearSection) {
            throw new ApiError(
                400,
                "For type 'upper', fitData.lower and fitData.footwear are not allowed"
            );
        }

        return;
    }
    if (type === "outerwear") {
        if (!hasUpper) {
            throw new ApiError(
                400,
                "For type 'outerwear', only fitData.upper is allowed"
            );
        }

        if (hasLowerSection || hasFootwearSection) {
            throw new ApiError(
                400,
                "For type 'outerwear', fitData.lower and fitData.footwear are not allowed"
            );
        }

        return;
    }

    if (type === "lower") {
        if (!hasLower) {
            throw new ApiError(
                400,
                "For type 'lower', only fitData.lower is allowed"
            );
        }

        if (hasUpperSection || hasFootwearSection) {
            throw new ApiError(
                400,
                "For type 'lower', fitData.upper and fitData.footwear are not allowed"
            );
        }

        return;
    }

    if (type === "footwear") {
        if (!hasFootwear) {
            throw new ApiError(
                400,
                "For type 'footwear', only fitData.footwear is allowed"
            );
        }

        if (hasUpperSection || hasLowerSection) {
            throw new ApiError(
                400,
                "For type 'footwear', fitData.upper and fitData.lower are not allowed"
            );
        }

        return;
    }

    throw new ApiError(400, "Invalid product type");
};

const analyzeProductImage = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Image is required for analysis");

    try {
        const imageBuffer = fs.readFileSync(req.file.path);
        const aiMetadata = await generateClothingMetadata(imageBuffer, req.file.mimetype);

        if (!aiMetadata) {
            throw new ApiError(500, "Failed to analyze image");
        }

        const normalizedType = normalizeAnalyzedProductType(aiMetadata.type);

        if (req.file.path) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    category: aiMetadata.category,
                    type: normalizedType,
                    color: aiMetadata.color,
                    season: aiMetadata.season,
                    occasion: aiMetadata.occasion,
                },
                "Image analyzed successfully"
            )
        );
    } catch (error) {
        console.error("Product AI Analysis Failed:", error);

        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        throw error instanceof ApiError ? error : new ApiError(503, "AI analysis failed");
    }
});

const uploadMultipleImages = async (files) => {
    if (!files || files.length === 0) {
        return [];
    }

    const uploadPromises = files.map(async (file) => {
        const uploadResult = await uploadOnCloudinary(file.path);
        if (!uploadResult) {
            throw new ApiError(500, `Failed to upload image: ${file.originalname}`);
        }
        return {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        };
    });

    return await Promise.all(uploadPromises);
};

const deleteMultipleImages = async (images) => {
    if (!images || images.length === 0) return;
    
    const deletePromises = images.map(async (image) => {
        if (image.publicId) {
            await deleteFromCloudinary(image.publicId, "image");
        }
    });
    
    await Promise.all(deletePromises);
};

const addProduct = asyncHandler(async (req, res) => {
    const { type, category, color, colorGroup, occasion } = req.body;
    const fitData = parseFitData(req.body.fitData);
    const season = parseSeason(req.body.season);
    const isPublished = parseIsPublished(req.body.isPublished);
    
    const productImages = req.files?.productImages || [];

    // Validate required fields
    if (!req.files || !req.files.productImages || productImages.length === 0) {
        throw new ApiError(400, "At least one product image is required");
    }

    if (!type || !category || !fitData || !color || !colorGroup || !occasion) {
        throw new ApiError(400, "Type, category, fitData, color, colorGroup, and occasion are required");
    }

    validateFitData(type, fitData);

    const normalizedColor = color.toLowerCase();
    const normalizedColorGroup = colorGroup || COLOR_GROUP_MAP[normalizedColor];

    if (!normalizedColorGroup) {
        throw new ApiError(400, `Unsupported color: ${color}`);
    }

    // Upload all product images
    const uploadedImages = await uploadMultipleImages(productImages);

    const product = await Product.create({
        seller: req.user._id,
        type,
        category,
        fitData,
        color: normalizedColor,
        colorGroup: normalizedColorGroup,
        occasion,
        season: season || [],
        media: {
            productImages: uploadedImages,
            aiModelPreview: null // Will be generated by AI pipeline
        },
        isActive: true,
        isPublished: isPublished ?? false
    });

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product added successfully"));
});

const updateProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { category, type, seller, color, colorGroup, occasion } = req.body;
    const fitData =
        typeof req.body.fitData === "undefined"
            ? undefined
            : parseFitData(req.body.fitData);
    const season = typeof req.body.season === "undefined"
        ? undefined
        : parseSeason(req.body.season);
    const isActive = parseIsActive(req.body.isActive);
    const isPublished = parseIsPublished(req.body.isPublished);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    if (
        typeof category !== "undefined" ||
        typeof type !== "undefined" ||
        typeof seller !== "undefined"
    ) {
        throw new ApiError(400, "category, type and seller cannot be updated");
    }

    const product = await Product.findOne({
        _id: productId,
        seller: req.user._id,
    });

    if (!product) throw new ApiError(404, "Product not found");

    // Update fitData if provided
    if (fitData !== undefined) {
        validateFitData(product.type, fitData);
        product.fitData = fitData;
    }

    // Update basic fields if provided
    if (color !== undefined) product.color = color;
    if (colorGroup !== undefined) product.colorGroup = colorGroup;
    if (occasion !== undefined) product.occasion = occasion;
    if (season !== undefined) product.season = season;

    // Update isActive if provided
    if (typeof isActive !== "undefined") {
        product.isActive = isActive;
    }

    if (typeof isPublished !== "undefined") {
        product.isPublished = isPublished;
    }

    // Handle product images update
    const newProductImages = req.files?.productImages || [];
    
    if (newProductImages.length > 0) {
        // Delete old product images from Cloudinary
        const oldProductImages = product.media?.productImages || [];
        await deleteMultipleImages(oldProductImages);
        
        // Upload new product images
        const uploadedImages = await uploadMultipleImages(newProductImages);
        
        // Update media object
        product.media = {
            ...product.media,
            productImages: uploadedImages,
            // Preserve aiModelPreview if it exists (will be generated by AI pipeline)
            aiModelPreview: product.media?.aiModelPreview || null
        };
    }

    await product.save();

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product updated successfully"));
});

const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find(productVisibilityQuery)
        .populate("seller", "name email avatar contactNumber source")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, products, "Products fetched successfully"));
});

const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findOne({
        _id: productId,
        ...productVisibilityQuery,
    }).populate("seller", "name email avatar contactNumber source");

    if (!product) throw new ApiError(404, "Product not found");

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const getProductsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;

    const products = await Product.find({
        category,
        ...productVisibilityQuery,
    })
        .populate("seller", "name email avatar contactNumber source")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(200, products, "Category products fetched successfully")
        );
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product id");
    }

    const product = await Product.findOneAndUpdate(
        {
            _id: productId,
            seller: req.user._id,
            isActive: true,
        },
        {
            $set: {
                isActive: false,
            },
        },
        {
            new: true,
        }
    );

    if (!product) throw new ApiError(404, "Product not found");

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

export {
    addProduct,
    analyzeProductImage,
    updateProductById,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    deleteProduct,
};
