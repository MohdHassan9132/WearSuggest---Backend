const UPPER_EASE_RANGES = {
    slim: {
        chest: { min: 2, max: 5 },
        waist: { min: 1, max: 4 },
        shoulder: { min: 0, max: 1 },
        sleeveLength: { min: -1, max: 1 },
        length: { min: -2, max: 3 },
    },
    regular: {
        chest: { min: 6, max: 10 },
        waist: { min: 4, max: 8 },
        shoulder: { min: 1, max: 2 },
        sleeveLength: { min: -1, max: 2 },
        length: { min: -2, max: 4 },
    },
    loose: {
        chest: { min: 10, max: 16 },
        waist: { min: 8, max: 14 },
        shoulder: { min: 2, max: 4 },
        sleeveLength: { min: 0, max: 3 },
        length: { min: 0, max: 5 },
    },
    oversized: {
        chest: { min: 16, max: 26 },
        waist: { min: 14, max: 24 },
        shoulder: { min: 4, max: 8 },
        sleeveLength: { min: 1, max: 5 },
        length: { min: 2, max: 8 },
    },
};

const LOWER_EASE_RANGES = {
    slim: {
        waist: { min: 1, max: 3 },
        thigh: { min: 2, max: 4 },
        length: { min: -2, max: 2 },
    },
    regular: {
        waist: { min: 3, max: 6 },
        thigh: { min: 4, max: 7 },
        length: { min: -2, max: 3 },
    },
    loose: {
        waist: { min: 6, max: 10 },
        thigh: { min: 7, max: 12 },
        length: { min: -1, max: 4 },
    },
    oversized: {
        waist: { min: 10, max: 16 },
        thigh: { min: 12, max: 20 },
        length: { min: 0, max: 6 },
    },
};

const OUTERWEAR_EASE_RANGES = {
    slim: {
        chest: { min: 6, max: 10 },
        waist: { min: 4, max: 8 },
        shoulder: { min: 1, max: 2 },
        sleeveLength: { min: 0, max: 2 },
        length: { min: -2, max: 4 },
    },

    regular: {
        chest: { min: 10, max: 14 },
        waist: { min: 8, max: 12 },
        shoulder: { min: 2, max: 4 },
        sleeveLength: { min: 0, max: 3 },
        length: { min: -1, max: 5 },
    },

    loose: {
        chest: { min: 14, max: 20 },
        waist: { min: 12, max: 18 },
        shoulder: { min: 4, max: 6 },
        sleeveLength: { min: 1, max: 4 },
        length: { min: 0, max: 6 },
    },

    oversized: {
        chest: { min: 20, max: 30 },
        waist: { min: 18, max: 28 },
        shoulder: { min: 6, max: 10 },
        sleeveLength: { min: 2, max: 6 },
        length: { min: 2, max: 10 },
    },
};

const UPPER_WEIGHTS = {
    chest: 0.40,
    shoulder: 0.25,
    waist: 0.20,
    sleeveLength: 0.10,
    length: 0.05,
};

const LOWER_WEIGHTS = {
    waist: 0.45,
    thigh: 0.35,
    length: 0.20,
};

export { UPPER_EASE_RANGES, LOWER_EASE_RANGES, UPPER_WEIGHTS, LOWER_WEIGHTS,OUTERWEAR_EASE_RANGES };
