import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ClothingItem } from "../models/clothingItem.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { COLOR_GROUP_MAP } from "../constants/colors.js";
import mongoose from "mongoose";

const addClothingItem = asyncHandler(async (req, res) => {
  let { type, category, color, season, occasion } = req.body;

  // 1️⃣ Basic required fields
  if (!type || !category || !color) {
    throw new ApiError(400, "Type, category and color are required");
  }

  // 2️⃣ IMAGE IS MANDATORY
  if (!req.file?.path) {
    throw new ApiError(400, "Clothing image is required");
  }

  // 3️⃣ Normalize color
  const normalizedColor = color.toLowerCase();
  const colorGroup = COLOR_GROUP_MAP[normalizedColor];

  if (!colorGroup) {
    throw new ApiError(400, "Unsupported color");
  }

  // 4️⃣ Normalize season & occasion to arrays
  const normalizeToArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    // handle JSON string or single value
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  };

  season = normalizeToArray(season);
  occasion = normalizeToArray(occasion);

  // 5️⃣ VALIDATION
  if (!season.length || !occasion.length) {
    throw new ApiError(
      400,
      "Season and occasion are required"
    );
  }

  // 6️⃣ Upload image
  const uploadResult = await uploadOnCloudinary(req.file.path);
  if (!uploadResult) {
    throw new ApiError(500, "Image upload failed");
  }

  // 7️⃣ Create clothing item
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

  return res
    .status(201)
    .json(new ApiResponse(201, item, "Clothing item added successfully"));
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
    .json(new ApiResponse(200, items, "Clothing items fetched successfully"));
});
const getClothingItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1️⃣ Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid clothing item id");
  }

  // 2️⃣ Fetch item (user scoped)
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
    .json(new ApiResponse(200, items, "Deleted clothing items fetched successfully"));
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
    .json(new ApiResponse(200, item, "Clothing item restored successfully"));
});

const deleteClothingItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1️⃣ Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid clothing item id");
  }

  // 2️⃣ Find and soft delete
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




export { addClothingItem, getClothingItems, getDeletedClothingItems, restoreClothingItem, getClothingItemById, deleteClothingItem };
