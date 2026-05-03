import { FIT_SCORING_RULES } from "./fitRules.js";

const getRequiredEase = (key, scoringProfile) => {
    if (scoringProfile === "outerwear") {
        if (key === "chest") return 6;
        if (key === "waist") return 6;
        return 2;
    }

    if (scoringProfile === "upper") {
        if (key === "chest") return 2;
        if (key === "waist") return 2;
        return 1;
    }

    if (scoringProfile === "lower") {
        if (key === "waist") return 3;
        return 2;
    }

    return 0;
};

const getMiss = (difference, range) => {
    if (difference >= range.min && difference <= range.max) return 0;
    return difference < range.min ? range.min - difference : difference - range.max;
};

const isTightFit = (difference, range) => difference < range.min;

const getRelativeMiss = (miss, userVal, garmentVal) => {
    const baseline = Math.max(userVal || 0, garmentVal || 0, 1);
    return miss / baseline;
};

const getStatus = (difference, range, scoringRules) => {
    if (difference >= range.min && difference <= range.max) return "perfect";

    const miss = getMiss(difference, range);
    const tight = isTightFit(difference, range);
    const goodThreshold = tight ? scoringRules.goodTightThreshold : scoringRules.goodLooseThreshold;

    if (miss <= 2) return tight ? "slightly tight" : "slightly loose";
    if (miss <= goodThreshold) return tight ? "too tight" : "too loose";

    return tight ? "way too tight" : "way too loose";
};

const getIssueMessage = (difference, range, label) => {
    if (difference >= range.min && difference <= range.max) return null;

    if (difference < range.min) {
        const by = Math.abs(range.min - difference);
        const qualifier = label === "sleeveLength" ? "too short" : "too tight";
        return `${label} ${qualifier} by ${by} cm`;
    }

    const by = Math.abs(difference - range.max);
    const qualifier = label === "sleeveLength" ? "too long" : "too loose";
    return `${label} ${qualifier} by ${by} cm`;
};

const getMeasurementRule = (scoringRules, key) => {
    const overrides = scoringRules.measurementRules?.[key] || {};

    return {
        perfectLooseThreshold: overrides.perfectLooseThreshold ?? scoringRules.perfectLooseThreshold,
        perfectTightAllowance: overrides.perfectTightAllowance ?? scoringRules.perfectTightAllowance,
        goodTightThreshold: overrides.goodTightThreshold ?? scoringRules.goodTightThreshold,
        goodLooseThreshold: overrides.goodLooseThreshold ?? scoringRules.goodLooseThreshold,
        criticalFailureThreshold:
            overrides.criticalFailureThreshold ?? scoringRules.criticalFailureThreshold,
        badTightThreshold: overrides.badTightThreshold ?? overrides.goodTightThreshold ?? scoringRules.badTightThreshold,
        badLooseThreshold: overrides.badLooseThreshold ?? overrides.goodLooseThreshold ?? scoringRules.badLooseThreshold,
    };
};

const REAL_FIT_THRESHOLDS = {
    upper: {
        badMin: -4,
        perfectMin: 1,
        perfectMax: 3,
        goodLooseMax: 15,
        badMax: 15,
    },
    lower: {
        badMin: -5,
        perfectMin: 2,
        perfectMax: 5,
        goodLooseMax: 10,
        badMax: 10,
    },
    outerwear: {
        badMin: -6,
        perfectMin: 4,
        perfectMax: 10,
        goodLooseMax: 15,
        badMax: 15,
    },
};

const getRealFitReason = (key, realDifference) => {
    if (realDifference < 0) {
        return `${key} too tight by ${Math.abs(realDifference)} cm`;
    }

    if (realDifference > 0) {
        return `${key} too loose by ${realDifference} cm`;
    }

    return "Well balanced fit";
};

const classifyFit = (misses, scoringRules, scoringProfile) => {
    const hasMeasurements = misses.length > 0;

    if (!hasMeasurements) {
        return { fitType: "bad", reason: "Insufficient measurements for fit prediction" };
    }

    const profileThresholds = REAL_FIT_THRESHOLDS[scoringProfile] || REAL_FIT_THRESHOLDS.upper;
    const primary = misses.find(({ key }) => scoringRules.primaryMeasurements.includes(key));

    if (!primary) {
        return { fitType: "bad", reason: "Insufficient measurements for fit prediction" };
    }

    const d = primary.realDifference;
    const t = profileThresholds;

    if (d < t.badMin || d > t.badMax) {
        return {
            fitType: "bad",
            reason: getRealFitReason(primary.key, d),
        };
    }

    if (d >= t.perfectMin && d <= t.perfectMax) {
        return {
            fitType: "perfect",
            reason: "Well balanced fit",
        };
    }

    if (scoringProfile === "outerwear" && d > t.goodLooseMax) {
        return {
            fitType: "bad",
            reason: getRealFitReason(primary.key, d),
        };
    }

    return {
        fitType: "good",
        reason: getRealFitReason(primary.key, d),
    };
};

const calculatePercentage = (fitType, misses, weights, scoringRules) => {
    const severity = misses.reduce((total, item) => {
        const weight = weights[item.key] ?? 0;
        const directionMultiplier = item.tight ? scoringRules.tightPenaltyMultiplier : scoringRules.loosePenaltyMultiplier;
        const weightedMiss = (item.miss * scoringRules.absolutePenaltyFactor) * directionMultiplier;

        return total + weightedMiss * Math.max(weight, 0.05);
    }, 0);

    if (fitType === "perfect") {
        return Math.max(90, Math.round(99 - severity));
    }

    if (fitType === "good") {
        return Math.max(70, Math.min(89, Math.round(87 - severity)));
    }

    return Math.max(30, Math.min(69, Math.round(66 - severity)));
};

const getFitLabel = (fitType) => {
    if (fitType === "perfect") return "Perfect Fit";
    if (fitType === "good") return "Good Fit";
    return "Will Not Fit";
};

const calculateFit = (garmentMeasurements, userMeasurements, easeRanges, weights, scoringProfile = "upper") => {
    const scoringRules = FIT_SCORING_RULES[scoringProfile] || FIT_SCORING_RULES.upper;
    const details = {};
    const issues = [];
    const misses = [];

    for (const key of Object.keys(weights)) {
        const garmentVal = garmentMeasurements[key];
        const userVal = userMeasurements[key];

        if (garmentVal == null || userVal == null) continue;

        const range = easeRanges[key];
        const idealMeasurement = userVal + getRequiredEase(key, scoringProfile);
        const difference = garmentVal - idealMeasurement;
        const realDifference = garmentVal - userVal;
        const comparisonValue = scoringProfile === "outerwear" ? realDifference : difference;
        const miss = getMiss(comparisonValue, range);
        const tight = isTightFit(comparisonValue, range);
        const relativeMiss = getRelativeMiss(miss, userVal, garmentVal);
        const issue = getIssueMessage(difference, range, key);
        const status = getStatus(difference, range, getMeasurementRule(scoringRules, key));

        if (issue) issues.push(issue);

        misses.push({
            key,
            miss,
            tight,
            relativeMiss,
            issue,
            difference,
            realDifference,
        });

        details[key] = {
            user: userVal,
            garment: garmentVal,
            difference,
            realDifference,
            idealRange: { min: range.min, max: range.max },
            status,
            issue,
            miss,
            fitSide: miss === 0 ? "ideal" : tight ? "tight" : "loose",
        };
    }

    const classification = classifyFit(misses, scoringRules, scoringProfile);
    const fitScore = calculatePercentage(classification.fitType, misses, weights, scoringRules);
    const fitLabel = getFitLabel(classification.fitType);

    return {
        fitScore,
        fitLabel,
        issues,
        details,
        fitType: classification.fitType,
        shortReason: classification.reason,
    };
};

export { calculateFit, getFitLabel };
