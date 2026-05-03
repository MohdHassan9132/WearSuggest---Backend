import { ClothingItem } from "../../models/clothingItem.model.js";
import { Outfit } from "../../models/outfit.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { filterByOccasion } from "./occasion.service.js";
import { filterBySeason } from "./season.service.js";
import { getValidTopBottomPairs } from "./color.service.js";

const ONE_DAY = 24 * 60 * 60 * 1000;

const pickRandom = (items) =>
  items[Math.floor(Math.random() * items.length)];

const sortByStableKey = (items) =>
  [...items].sort((left, right) => {
    const createdAtCompare =
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();

    if (createdAtCompare !== 0) {
      return createdAtCompare;
    }

    return String(left._id).localeCompare(String(right._id));
  });

const sortPairsDeterministically = (pairs) =>
  [...pairs].sort((left, right) => {
    const leftKey = `${left.top._id}:${left.bottom._id}`;
    const rightKey = `${right.top._id}:${right.bottom._id}`;
    return leftKey.localeCompare(rightKey);
  });

const splitByCategory = (items) => {
  const categories = {
    top: [],
    bottom: [],
    footwear: [],
    outerwear: [],
    accessory: [],
  };

  for (const item of sortByStableKey(items)) {
    if (categories[item.type]) {
      categories[item.type].push(item);
    }
  }

  return categories;
};

const buildFilteredPools = (items, occasion, season) => {
  const occasionFiltered = filterByOccasion(items, occasion);
  const seasonFiltered = filterBySeason(occasionFiltered, season);
  return splitByCategory(seasonFiltered);
};

const selectAccessories = (items, max = 2) => sortByStableKey(items).slice(0, max);

const selectOuterwear = (items, includeOuterwear) => {
  if (!includeOuterwear) {
    return null;
  }

  return items.length ? pickRandom(items) : null;
};

const selectFootwear = (items, pair) => {
  const sortedFootwear = sortByStableKey(items);

  const matchTop = sortedFootwear.filter(
    (item) => item.colorGroup === pair.top.colorGroup
  );

  const matchBottom = sortedFootwear.filter(
    (item) => item.colorGroup === pair.bottom.colorGroup
  );

  if (matchTop.length) return pickRandom(matchTop);
  if (matchBottom.length) return pickRandom(matchBottom);

  return sortedFootwear.length ? pickRandom(sortedFootwear) : null;
};

const buildOutfitPayload = ({
  pair,
  selectedFootwear,
  selectedOuterwear,
  selectedAccessories,
}) => ({
  top: pair.top,
  bottom: pair.bottom,
  footwear: selectedFootwear,
  outerwear: selectedOuterwear,
  accessories: selectedAccessories,
});

export const generateOutfit = async ({
  userId,
  occasion,
  season,
  includeOuterwear = false,
}) => {
  const items = await ClothingItem.find({
    owner: userId,
    isActive: true,
  });

  if (!items.length) {
    throw new ApiError(400, "No clothing items found");
  }

  const {
    top: tops,
    bottom: bottoms,
    footwear,
    outerwear,
    accessory: accessories,
  } = buildFilteredPools(items, occasion, season);

  if (!tops.length || !bottoms.length) {
    throw new ApiError(
      400,
      "Not enough upper or lower items for selected occasion and season"
    );
  }

  const validPairs = sortPairsDeterministically(getValidTopBottomPairs(tops, bottoms));

  if (!validPairs.length) {
    throw new ApiError(400, "No color-compatible outfit found");
  }

  const now = new Date();
  const selectedAccessories = selectAccessories(accessories);

  for (const pair of validPairs) {
    const existing = await Outfit.findOne({
      owner: userId,
      top: pair.top._id,
      bottom: pair.bottom._id,
    });

    const recentlyWorn =
      existing?.lastWornAt && now - existing.lastWornAt < ONE_DAY;

    if (recentlyWorn) {
      continue;
    }

    const selectedFootwear = selectFootwear(footwear, pair);
    const selectedOuterwear = selectOuterwear(outerwear, includeOuterwear);

    await Outfit.findOneAndUpdate(
      {
        owner: userId,
        top: pair.top._id,
        bottom: pair.bottom._id,
      },
      {
        $set: {
          lastWornAt: now,
          accessories: selectedAccessories.map((item) => item._id),
          footwear: selectedFootwear?._id ?? null,
          outerwear: selectedOuterwear?._id ?? null,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return buildOutfitPayload({
      pair,
      selectedFootwear,
      selectedOuterwear,
      selectedAccessories,
    });
  }

  const fallbackPair = validPairs[0];
  const selectedFootwear = selectFootwear(footwear, fallbackPair);
  const selectedOuterwear = selectOuterwear(outerwear, includeOuterwear);

  await Outfit.findOneAndUpdate(
    {
      owner: userId,
      top: fallbackPair.top._id,
      bottom: fallbackPair.bottom._id,
    },
    {
      $set: {
        lastWornAt: now,
        accessories: selectedAccessories.map((item) => item._id),
        footwear: selectedFootwear?._id ?? null,
        outerwear: selectedOuterwear?._id ?? null,
      },
    },
    { upsert: true }
  );

  return {
    ...buildOutfitPayload({
      pair: fallbackPair,
      selectedFootwear,
      selectedOuterwear,
      selectedAccessories,
    }),
    note: "Only one possible outfit available",
  };
};

export const generateToneBasedOutfit = async ({
  userId,
  occasion,
  season,
  tone,
  includeOuterwear = false,
}) => {
  const items = await ClothingItem.find({
    owner: userId,
    isActive: true,
  });

  if (!items.length) {
    throw new ApiError(400, "No clothing items found");
  }

  const normalizedTone = tone.toLowerCase();
  const pools = buildFilteredPools(items, occasion, season);

  const tops = pools.top.filter((item) => item.colorGroup === normalizedTone);
  const bottoms = pools.bottom.filter((item) => item.colorGroup === normalizedTone);
  const footwear = pools.footwear.filter((item) => item.colorGroup === normalizedTone);
  const outerwear = pools.outerwear.filter((item) => item.colorGroup === normalizedTone);
  const accessories = pools.accessory.filter((item) => item.colorGroup === normalizedTone);

  if (!tops.length || !bottoms.length) {
    throw new ApiError(
      400,
      "Not enough upper or lower items for selected occasion and season"
    );
  }

  const validPairs = sortPairsDeterministically(getValidTopBottomPairs(tops, bottoms));

  if (!validPairs.length) {
    throw new ApiError(
      400,
      `No color-compatible '${normalizedTone}' outfit found for ${season}/${occasion}`
    );
  }

  const selectedPair = validPairs[0];
  const selectedFootwear = selectFootwear(footwear, selectedPair);
  const selectedAccessories = selectAccessories(accessories);
  const selectedOuterwear = selectOuterwear(outerwear, includeOuterwear);
  const now = new Date();

  await Outfit.findOneAndUpdate(
    {
      owner: userId,
      top: selectedPair.top._id,
      bottom: selectedPair.bottom._id,
    },
    {
      $set: {
        lastWornAt: now,
        accessories: selectedAccessories.map((item) => item._id),
        footwear: selectedFootwear?._id ?? null,
        outerwear: selectedOuterwear?._id ?? null,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );

  return {
    ...buildOutfitPayload({
      pair: selectedPair,
      selectedFootwear,
      selectedOuterwear,
      selectedAccessories,
    }),
    note: `Generated based on ${normalizedTone} tone preference`,
  };
};
