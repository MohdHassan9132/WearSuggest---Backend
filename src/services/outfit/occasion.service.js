export const filterByOccasion = (items, occasion) => {
  const lowerOccasion = occasion.toLowerCase();
  return items.filter(item =>
    item.occasion.length === 0 || item.occasion.some(o => o.toLowerCase() === lowerOccasion)
  );
};
