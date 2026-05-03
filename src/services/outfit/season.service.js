export const filterBySeason = (items, season) => {
  const lowerSeason = season.toLowerCase();
  return items.filter(
    (item) => Array.isArray(item.season) && item.season.includes(lowerSeason)
  );
};
