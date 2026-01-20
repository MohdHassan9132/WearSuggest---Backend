export const filterByOccasion = (items, occasion) => {
  return items.filter(item =>
    item.occasion.length === 0 || item.occasion.includes(occasion)
  );
};
