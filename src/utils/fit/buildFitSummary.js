const FIT_DESCRIPTIONS = {
    upper: {
        slim: "This top is designed to fit close to the body.",
        regular: "This top is designed for a balanced and comfortable fit.",
        loose: "This top is designed with extra room for comfort.",
        oversized: "This top is designed to fit intentionally large and roomy.",
    },

    outerwear: {
        slim: "This outerwear is designed to sit close over light layers.",
        regular: "This outerwear is designed to fit comfortably over a shirt or light layer.",
        loose: "This outerwear is designed with extra room for layering.",
        oversized: "This outerwear is designed to fit very roomy over heavier layers.",
    },

    lower: {
        slim: "These bottoms are designed to fit close to the body.",
        regular: "These bottoms are designed for a comfortable everyday fit.",
        loose: "These bottoms are designed with more room through the waist and thigh.",
        oversized: "These bottoms are designed to fit intentionally loose and wide.",
    },
};

const BASE_SUMMARIES = {
    upper: {
        great: "The top should fit exactly as intended with enough room for comfortable movement.",
        good: "The top should fit well overall.",
        okay: "The top is wearable, but there are noticeable fit issues.",
        bad: "The top is unlikely to fit comfortably.",
    },

    outerwear: {
        great: "The outerwear should fit comfortably over your existing clothes with enough room for movement.",
        good: "The outerwear should fit well overall over a shirt or light layer.",
        okay: "The outerwear may fit, but layering underneath could feel restrictive.",
        bad: "The outerwear is unlikely to fit comfortably over your clothes.",
    },

    lower: {
        great: "The bottoms should fit comfortably through the waist and leg.",
        good: "The bottoms should fit well overall.",
        okay: "The bottoms are wearable, but there are noticeable fit issues.",
        bad: "The bottoms are unlikely to fit comfortably.",
    },
};

const buildFitSummary = ({
    fitScore,
    issues,
    type = "upper",
    fitType = "regular",
}) => {
    const summaries = BASE_SUMMARIES[type] || BASE_SUMMARIES.upper;

    let summary;

    if (fitScore >= 90) {
        summary = summaries.great;
    } else if (fitScore >= 75) {
        summary = summaries.good;
    } else if (fitScore >= 60) {
        summary = summaries.okay;
    } else {
        summary = summaries.bad;
    }

    if (issues.length > 0) {
        summary += ` Main concern: ${issues.slice(0, 2).join(" and ")}.`;
    }

    const fitDescription = FIT_DESCRIPTIONS[type]?.[fitType];

    if (fitDescription) {
        summary += ` ${fitDescription}`;
    }

    return summary;
};

export { buildFitSummary };