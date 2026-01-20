import { isColorCompatible } from "../../rules/color.rules.js";

export const getValidTopBottomPairs = (tops, bottoms) => {
  const pairs = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      if (isColorCompatible(top, bottom)) {
        pairs.push({ top, bottom });
      }
    }
  }

  return pairs;
};
