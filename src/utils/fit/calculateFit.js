const scoreMeasurement = (difference, range) => {
    const { min, max } = range;

    if (difference >= min && difference <= max) return 100;

    const miss = difference < min ? min - difference : difference - max;

    if (miss <= 2) return 75;
    if (miss <= 5) return 40;

    return 0;
};

const getStatus = (difference, range) => {
    const { min, max } = range;

    if (difference >= min && difference <= max) return "perfect";

    const miss = difference < min ? min - difference : difference - max;
    const isTight = difference < min;

    if (miss <= 2) return isTight ? "slightly tight" : "slightly loose";
    if (miss <= 5) return isTight ? "too tight" : "too loose";

    return isTight ? "way too tight" : "way too loose";
};

const getIssueMessage = (difference, range, label) => {
    const { min, max } = range;

    if (difference >= min && difference <= max) return null;

    if (difference < min) {
        const by = Math.abs(min - difference);
        const qualifier = label === "sleeveLength" ? "too short" : "too tight";
        return `${label} ${qualifier} by ${by} cm`;
    }

    const by = Math.abs(difference - max);
    const qualifier = label === "sleeveLength" ? "too long" : "too loose";
    return `${label} ${qualifier} by ${by} cm`;
};

const getFitLabel = (score) => {
    if (score >= 90) return "Perfect Fit";
    if (score >= 75) return "Good Fit";
    if (score >= 60) return "Okay but not ideal";
    if (score >= 40) return "Poor Fit";
    return "Will Not Fit";
};

const calculateFit = (garmentMeasurements, userMeasurements, easeRanges, weights) => {
    const details = {};
    const issues = [];
    let weightedSum = 0;
    let weightSum = 0;

    for (const key of Object.keys(weights)) {
        const garmentVal = garmentMeasurements[key];
        const userVal = userMeasurements[key];

        if (garmentVal == null || userVal == null) continue;

        const range = easeRanges[key];
        const difference = garmentVal - userVal;
        const score = scoreMeasurement(difference, range);
        const status = getStatus(difference, range);
        const issue = getIssueMessage(difference, range, key);

        if (issue) issues.push(issue);

        const weight = weights[key];
        weightedSum += score * weight;
        weightSum += weight;

        details[key] = {
            user: userVal,
            garment: garmentVal,
            difference,
            idealRange: { min: range.min, max: range.max },
            score,
            status,
            issue,
        };
    }

    const fitScore = weightSum > 0 ? Math.round(weightedSum / weightSum) : 0;
    const fitLabel = getFitLabel(fitScore);

    return { fitScore, fitLabel, issues, details };
};

export { calculateFit, getFitLabel };
