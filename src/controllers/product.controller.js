import mongoose from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";

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

const parseIsActive = (isActive) => {
    if (typeof isActive === "undefined") return undefined;
    if (typeof isActive === "boolean") return isActive;
    if (isActive === "true") return true;
    if (isActive === "false") return false;

    throw new ApiError(400, "isActive must be a boolean value");
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

const addProduct = asyncHandler(async (req, res) => {
    const { type, category } = req.body;
    const fitData = parseFitData(req.body.fitData);

    if (!req.file) throw new ApiError(400, "Image is required");

    if (!type || !category || !fitData) {
        throw new ApiError(400, "Type, category and fitData are required");
    }

    validateFitData(type, fitData);

    const uploadResult = await uploadOnCloudinary(req.file.path);

    if (!uploadResult) throw new ApiError(500, "Image upload failed");

    const product = await Product.create({
        seller: req.user._id,
        type,
        category,
        fitData,
        imageURL: uploadResult.secure_url,
        imagePublicId: uploadResult.public_id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product added successfully"));
});

const updateProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { category, type, seller } = req.body;
    const fitData =
        typeof req.body.fitData === "undefined"
            ? undefined
            : parseFitData(req.body.fitData);
    const isActive = parseIsActive(req.body.isActive);

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

    if (fitData !== undefined) {
        validateFitData(product.type, fitData);
        product.fitData = fitData;
    }

    if (typeof isActive !== "undefined") {
        product.isActive = isActive;
    }

    if (req.file) {
        const uploadResult = await uploadOnCloudinary(req.file.path);

        if (!uploadResult) throw new ApiError(500, "Image upload failed");

        const oldImagePublicId = product.imagePublicId;

        product.imageURL = uploadResult.secure_url;
        product.imagePublicId = uploadResult.public_id;

        if (oldImagePublicId) {
            await deleteFromCloudinary(oldImagePublicId, "image");
        }
    }

    await product.save();

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product updated successfully"));
});

const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ isActive: true })
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
        isActive: true,
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
        isActive: true,
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
    updateProductById,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    deleteProduct,
};
