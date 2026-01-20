import { ClothingItem } from "../../models/clothingItem.model.js";
import { Outfit } from "../../models/outfit.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { filterByOccasion } from "./occasion.service.js";
import { filterBySeason } from "./season.service.js";
import { getValidTopBottomPairs } from "./color.service.js";

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickRandomAccessories = (items, max = 2) => {
  if (!items.length) return [];

  const shuffled = [...items].sort(() => 0.5 - Math.random());
  // Bias towards picking at least 1 item if available, up to max
  const min = items.length > 0 ? 1 : 0;
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return shuffled.slice(0, count);
};


const ONE_DAY = 24 * 60 * 60 * 1000;

export const generateOutfit = async ({ userId, occasion, season }) => {
  // 1️⃣ Fetch active clothing
  const items = await ClothingItem.find({
    owner: userId,
    isActive: true,
  });

  if (!items.length) {
    throw new ApiError(400, "No clothing items found");
  }

  // 2️⃣ Apply filters
  let filtered = filterByOccasion(items, occasion);
  filtered = filterBySeason(filtered, season);

  const tops = filtered.filter(i => i.type === "top");
  const bottoms = filtered.filter(i => i.type === "bottom");
  const footwear = filtered.filter(i => i.type === "footwear");
  const outerwear = filtered.filter(i => i.type === "outerwear");
  const accessories = filtered.filter(i => i.type === "accessory");


  if (!tops.length || !bottoms.length || !footwear.length) {
    throw new ApiError(400, "Not enough clothing items to form an outfit");
  }

  // 3️⃣ Generate valid color pairs
  const validPairs = getValidTopBottomPairs(tops, bottoms);

  if (!validPairs.length) {
    throw new ApiError(400, "No color-compatible outfit found");
  }

  const now = new Date();

  // 4️⃣ Try to find a non-recent outfit
  for (const pair of validPairs) {
    const existing = await Outfit.findOne({
      owner: userId,
      top: pair.top._id,
      bottom: pair.bottom._id,
    });

    const recentlyWorn =
      existing?.lastWornAt &&
      now - existing.lastWornAt < ONE_DAY;

    if (recentlyWorn) continue;

    const selectedAccessories = pickRandomAccessories(accessories);
    const selectedFootwear = pickRandom(footwear);
    const selectedOuterwear = outerwear.length ? pickRandom(outerwear) : null;

    // 5️⃣ Save / update outfit usage
    await Outfit.findOneAndUpdate(
      {
        owner: userId,
        top: pair.top._id,
        bottom: pair.bottom._id,
      },
      {
        $set: {
          lastWornAt: now,
          accessories: selectedAccessories.map(a => a._id),
          footwear: selectedFootwear._id,
          outerwear: selectedOuterwear ? selectedOuterwear._id : null
        },

      },
      {
        upsert: true,
        new: true,
      }
    );

    return {
      top: pair.top,
      bottom: pair.bottom,
      footwear: selectedFootwear,
      outerwear: selectedOuterwear,
      accessories: selectedAccessories
    };
  }

  // 6️⃣ Fallback (only one possible outfit)
  const fallback = validPairs[0];
  const fallbackAccessories = pickRandomAccessories(accessories);
  const fallbackFootwear = pickRandom(footwear);
  const fallbackOuterwear = outerwear.length ? pickRandom(outerwear) : null;

  await Outfit.findOneAndUpdate(
    {
      owner: userId,
      top: fallback.top._id,
      bottom: fallback.bottom._id,
    },
    {
      $set: {
        lastWornAt: now,
        accessories: fallbackAccessories.map(a => a._id),
        footwear: fallbackFootwear._id,
        outerwear: fallbackOuterwear ? fallbackOuterwear._id : null
      },
    },
    { upsert: true }
  );

  return {
    top: fallback.top,
    bottom: fallback.bottom,
    footwear: fallbackFootwear,
    outerwear: fallbackOuterwear,
    accessories: fallbackAccessories,
    note: "Only one possible outfit available",
  };
};
