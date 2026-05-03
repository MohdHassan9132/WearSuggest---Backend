export const filterByOccasion = (items, occasion) => {
  const lowerOccasion = occasion.toLowerCase();
  return items.filter((item) => item.occasion === lowerOccasion);
};
