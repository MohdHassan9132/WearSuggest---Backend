import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ClothingItem } from "../models/clothingItem.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { COLOR_GROUP_MAP } from "../constants/colors.js";
import { generateClothingMetadata } from "../services/ai/tagging.service.js";
import mongoose from "mongoose";
import fs from "fs";

const analyzeClothingImage = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Image is required for analysis");

    try {
        const imageBuffer = fs.readFileSync(req.file.path);
        const aiMetadata = await generateClothingMetadata(imageBuffer, req.file.mimetype);

        if (!aiMetadata) {
            throw new ApiError(500, "Failed to analyze image");
        }
        return res.status(200).json(new ApiResponse(200, aiMetadata, "Image analyzed successfully"));
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw new ApiError(500, "AI analysis failed");
    }
});

const addClothingItem = asyncHandler(async (req, res) => {
    let { type, category, color, season, occasion } = req.body;
    let colorGroup;

    if (!req.file) throw new ApiError(400, "Image is required");

    if (!type || !category || !color) {
        throw new ApiError(400, "Type, category and color are required");
    }

    const normalizedColor = color.toLowerCase();
    colorGroup = COLOR_GROUP_MAP[normalizedColor];
    if (!colorGroup) {
        throw new ApiError(400, `Unsupported color: ${color}`);
    }

    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult) throw new ApiError(500, "Image upload failed");

    const item = await ClothingItem.create({
        owner: req.user._id,
        type,
        category,
        color: normalizedColor,
        colorGroup,
        season,
        occasion,
        imageURL: uploadResult.secure_url,
        imagePublicId: uploadResult.public_id,
    });

    return res.status(201).json(new ApiResponse(201, item, "Added successfully"));
});

const getClothingItems = asyncHandler(async (req, res) => {
    const { type } = req.query;

    const query = {
        owner: req.user._id,
        isActive: true,
    };

    if (type) {
        query.type = type;
    }

    const items = await ClothingItem.find(query)
        .select("-imagePublicId")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(200, items, "Clothing items fetched successfully")
        );
});
const getClothingItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;


    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid clothing item id");
    }

    const item = await ClothingItem.findOne({
        _id: id,
        owner: req.user._id,
        isActive: true,
    }).select("-imagePublicId");

    if (!item) {
        throw new ApiError(404, "Clothing item not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, item, "Clothing item fetched successfully"));
});

const getDeletedClothingItems = asyncHandler(async (req, res) => {
    const items = await ClothingItem.find({
        owner: req.user._id,
        isActive: false,
    })
        .select("-imagePublicId")
        .sort({ updatedAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                items,
                "Deleted clothing items fetched successfully"
            )
        );
});

const restoreClothingItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid clothing item id");
    }

    const item = await ClothingItem.findOneAndUpdate(
        {
            _id: id,
            owner: req.user._id,
            isActive: false,
        },
        {
            $set: { isActive: true },
        },
        { new: true }
    );

    if (!item) {
        throw new ApiError(404, "Clothing item not found or already active");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, item, "Clothing item restored successfully")
        );
});

const deleteClothingItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid clothing item id");
    }

    const item = await ClothingItem.findOneAndUpdate(
        {
            _id: id,
            owner: req.user._id,
            isActive: true,
        },
        {
            $set: { isActive: false },
        },
        { new: true }
    );

    if (!item) {
        throw new ApiError(404, "Clothing item not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Clothing item deleted successfully"));
});

export {
    addClothingItem,
    getClothingItems,
    getDeletedClothingItems,
    restoreClothingItem,
    getClothingItemById,
    deleteClothingItem,
    analyzeClothingImage
};
