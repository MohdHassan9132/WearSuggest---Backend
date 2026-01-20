export const isColorCompatible = (top, bottom) => {
  if (top.colorGroup === "neutral") return true;
  if (bottom.colorGroup === "neutral") return true;

  return top.colorGroup !== bottom.colorGroup;
};
