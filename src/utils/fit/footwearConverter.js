const EU_CONVERSION_MAP = {
    Indian: { 6: 40, 7: 41, 8: 42, 9: 43, 10: 44 },
    UK: { 6: 40, 7: 41, 8: 42, 9: 43, 10: 44 },
    US: { 7: 40, 8: 41, 9: 42, 10: 43, 11: 44 },
};

const toEU = (region, size) => {
    const map = EU_CONVERSION_MAP[region];

    if (!map) return null;

    if (map[size] !== undefined) return map[size];

    const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
    const minKey = keys[0];
    const maxKey = keys[keys.length - 1];

    if (size < minKey) return map[minKey] - (minKey - size);
    if (size > maxKey) return map[maxKey] + (size - maxKey);

    for (let i = 0; i < keys.length - 1; i++) {
        if (size > keys[i] && size < keys[i + 1]) {
            const ratio = (size - keys[i]) / (keys[i + 1] - keys[i]);
            return map[keys[i]] + ratio * (map[keys[i + 1]] - map[keys[i]]);
        }
    }

    return null;
};

export { toEU };
