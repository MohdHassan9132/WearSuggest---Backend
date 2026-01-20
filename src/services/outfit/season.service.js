export const filterBySeason = (items, season) => {
  if (!season) return items;

  const lowerSeason = season.toLowerCase();
  return items.filter(item =>
    item.season.length === 0 || item.season.some(s => s.toLowerCase() === lowerSeason)
  );
};
