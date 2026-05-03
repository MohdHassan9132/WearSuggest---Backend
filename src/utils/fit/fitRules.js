const UPPER_EASE_RANGES = {
    slim: {
        chest: { min: 1, max: 5 },
        waist: { min: 1, max: 4 },
        shoulder: { min: 0, max: 1 },
        sleeveLength: { min: -1, max: 1 },
        length: { min: -2, max: 3 },
    },
    regular: {
        chest: { min: 3, max: 14 },
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
        waist: { min: 2, max: 5 },
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
        chest: { min: 6, max: 14 },
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

const FIT_SCORING_RULES = {
    upper: {
        criticalMeasurements: ["chest"],
        primaryMeasurements: ["chest"],
        perfectLooseThreshold: 3,
        perfectTightAllowance: 1,
        goodTightThreshold: 3,
        goodLooseThreshold: 6,
        badTightThreshold: 5,
        badLooseThreshold: 12,
        criticalFailureThreshold: 6,
        primaryTightThreshold: 4,
        tightPenaltyMultiplier: 1.5,
        loosePenaltyMultiplier: 0.4,
        absolutePenaltyFactor: 2.2,
        relativePenaltyFactor: 0.25,
        measurementRules: {
            chest: {
                perfectLooseThreshold: 3,
                perfectTightAllowance: 1,
                goodTightThreshold: 3,
                goodLooseThreshold: 6,
                badTightThreshold: 6,
                badLooseThreshold: 12,
                criticalFailureThreshold: 6,
            },
            shoulder: {
                perfectLooseThreshold: 3,
                perfectTightAllowance: 1,
                goodTightThreshold: 3,
                goodLooseThreshold: 6,
                badTightThreshold: 6,
                badLooseThreshold: 12,
            },
            waist: {
                perfectLooseThreshold: 3,
                perfectTightAllowance: 1,
                goodTightThreshold: 3,
                goodLooseThreshold: 6,
                badTightThreshold: 6,
                badLooseThreshold: 12,
            },
        },
    },
    lower: {
        criticalMeasurements: ["waist"],
        primaryMeasurements: ["waist"],
        perfectLooseThreshold: 4,
        perfectTightAllowance: 1,
        goodTightThreshold: 4,
        goodLooseThreshold: 3,
        badTightThreshold: 7,
        badLooseThreshold: 5,
        criticalFailureThreshold: 6,
        primaryTightThreshold: 4,
        tightPenaltyMultiplier: 1.5,
        loosePenaltyMultiplier: 0.4,
        absolutePenaltyFactor: 2.1,
        relativePenaltyFactor: 0.22,
        measurementRules: {
            waist: {
                perfectLooseThreshold: 4,
                perfectTightAllowance: 1,
                goodTightThreshold: 4,
                goodLooseThreshold: 3,
                badTightThreshold: 7,
                badLooseThreshold: 5,
                criticalFailureThreshold: 6,
            },
            thigh: {
                perfectLooseThreshold: 4,
                perfectTightAllowance: 1,
                goodTightThreshold: 3,
                goodLooseThreshold: 8,
                badTightThreshold: 6,
                badLooseThreshold: 12,
            },
            length: {
                perfectLooseThreshold: 4,
                perfectTightAllowance: 1,
                goodTightThreshold: 3,
                goodLooseThreshold: 8,
                badTightThreshold: 6,
                badLooseThreshold: 12,
            },
        },
    },
    outerwear: {
        criticalMeasurements: ["chest"],
        primaryMeasurements: ["chest"],
        perfectLooseThreshold: 6,
        perfectTightAllowance: 1,
        goodTightThreshold: 6,
        goodLooseThreshold: 12,
        badTightThreshold: 7,
        badLooseThreshold: 16,
        criticalFailureThreshold: 7,
        primaryTightThreshold: 5,
        tightPenaltyMultiplier: 1.5,
        loosePenaltyMultiplier: 0.7,
        absolutePenaltyFactor: 1.9,
        relativePenaltyFactor: 0.2,
        measurementRules: {
            chest: {
                perfectLooseThreshold: 6,
                perfectTightAllowance: 1,
                goodTightThreshold: 6,
                goodLooseThreshold: 12,
                badTightThreshold: 7,
                badLooseThreshold: 16,
                criticalFailureThreshold: 7,
            },
            shoulder: {
                perfectLooseThreshold: 6,
                perfectTightAllowance: 1,
                goodTightThreshold: 6,
                goodLooseThreshold: 12,
                badTightThreshold: 7,
                badLooseThreshold: 16,
            },
            waist: {
                perfectLooseThreshold: 6,
                perfectTightAllowance: 1,
                goodTightThreshold: 6,
                goodLooseThreshold: 12,
                badTightThreshold: 7,
                badLooseThreshold: 16,
            },
            sleeveLength: {
                perfectLooseThreshold: 6,
                perfectTightAllowance: 1,
                goodTightThreshold: 6,
                goodLooseThreshold: 12,
                badTightThreshold: 7,
                badLooseThreshold: 16,
            },
            length: {
                perfectLooseThreshold: 6,
                perfectTightAllowance: 1,
                goodTightThreshold: 6,
                goodLooseThreshold: 12,
                badTightThreshold: 7,
                badLooseThreshold: 16,
            },
        },
    },
};

export {
    UPPER_EASE_RANGES,
    LOWER_EASE_RANGES,
    UPPER_WEIGHTS,
    LOWER_WEIGHTS,
    OUTERWEAR_EASE_RANGES,
    FIT_SCORING_RULES,
};
