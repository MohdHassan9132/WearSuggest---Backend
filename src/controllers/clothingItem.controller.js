import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { clothingItem } from "../models/clothingItem.model.js";

const addClothingItem = asyncHandler(async (req, res) => {
// JWT Verify - isLoggedIn
// pass req.user._id as ownerId too
// image localpath, validate and upload on cloudinary
// put checks on required fields
// response url, public, save to db
// create a clothingItem doc
// save the doc and return without sensitive fields

    const { colour, category } = req.params;
    const allowedCategories = ['top', 'bottom', 'accessories'];

    const ownerId = req.user?._id;

    if(!colour?.trim() || !category?.trim()) throw new ApiError(400, "Both colour and categ;ory are required to proceed!")

    if(category.trim() && !allowedCategories.includes(category)) throw new ApiError(400, "Invalid category entered!");

    const itemImageLocalPath = req.file?.path;

    if (!itemImageLocalPath) throw new ApiError(400, "Missing clothing item image file");

    const response = await uploadOnCloudinary(itemImageLocalPath);

    const newClothingItem = await clothingItem.create({
        owner: owner,
        colour: colour,
        category: category,
        imageURL: response?.secure_url,
        imagePublicId: response?.public_id
    });

    newClothingItem.save();
    if(!newClothingItem) throw new ApiError(500, "Internal Server Error!");

    const newClothingItemObject = newClothingItem.toObject();
    delete newClothingItemObject.imagePublicId;

    return res
    .status(201)
    .json(new ApiResponse(201, newClothingItemObject, "Clothing Item was successfully added to wardrobe"));
    
});


const getItemById = asyncHandler(async (req, res) => {

});

const getAllTops = asyncHandler(async (req, res) => {

});

const getAllBottoms = asyncHandler(async (req, res) => {

});

const getAllAccessories = asyncHandler(async (req, res) => {

});