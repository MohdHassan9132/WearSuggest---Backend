import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateOutfit, generateToneBasedOutfit } from "../services/outfit/outfitAssembler.service.js";
import { Outfit } from "../models/outfit.model.js";

const VALID_OCCASIONS = ["casual", "formal", "party"];
const VALID_SEASONS = ["summer", "winter", "rainy"];

const normalizeOccasion = (occasion) => {
  if (typeof occasion !== "string") {
    throw new ApiError(400, "Occasion is required");
  }

  const normalizedOccasion = occasion.trim().toLowerCase();

  if (!VALID_OCCASIONS.includes(normalizedOccasion)) {
    throw new ApiError(400, "Occasion must be one of casual, formal, or party");
  }

  return normalizedOccasion;
};

const normalizeSeason = (season) => {
  if (typeof season !== "string") {
    throw new ApiError(400, "Season is required");
  }

  const normalizedSeason = season.trim().toLowerCase();

  if (!VALID_SEASONS.includes(normalizedSeason)) {
    throw new ApiError(400, "Season must be one of summer, winter, or rainy");
  }

  return normalizedSeason;
};

const suggestOutfit = asyncHandler(async (req, res) => {
  const occasion = normalizeOccasion(req.body.occasion);
  const season = normalizeSeason(req.body.season);
  const includeOuterwear = req.body.includeOuterwear === true;

  const outfit = await generateOutfit({
    userId: req.user._id,
    occasion,
    season,
    includeOuterwear,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, outfit, "Outfit suggested successfully"));
});

const suggestToneBasedOutfit = asyncHandler(async (req, res) => {
  const occasion = normalizeOccasion(req.body.occasion);
  const season = normalizeSeason(req.body.season);
  const { tone } = req.body;
  const includeOuterwear = req.body.includeOuterwear === true;

  if (!tone) {
    throw new ApiError(400, "Occasion, season and tone are required");
  }

  const outfit = await generateToneBasedOutfit({
    userId: req.user._id,
    occasion,
    season,
    tone,
    includeOuterwear,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, outfit, `Outfit in ${tone} tone suggested successfully`));
});

const getRecentOutfits = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 7, 20);

  const outfits = await Outfit.find({
    owner: req.user._id,
  })
    .sort({ lastWornAt: -1 })
    .limit(limit)
    .populate("top", "-imagePublicId")
    .populate("bottom", "-imagePublicId")
    .populate("footwear", "-imagePublicId")
    .populate("outerwear", "-imagePublicId")
    .populate("accessories", "-imagePublicId");

  return res.status(200).json(
    new ApiResponse(200, outfits, "Recent outfits fetched successfully")
  );
});


export { suggestOutfit, suggestToneBasedOutfit, getRecentOutfits };
