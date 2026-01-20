export const filterBySeason = (items, season) => {
  if (!season) return items;

  return items.filter(item =>
    item.season.length === 0 || item.season.includes(season)
  );
};
