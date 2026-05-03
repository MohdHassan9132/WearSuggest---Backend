const buildFitSummary = ({ fitScore }) => {
    if (fitScore >= 90) {
        return "This will fit as intended.";
    }

    if (fitScore >= 75) {
        return "This should fit well with minor adjustments.";
    }

    return "This may not fit comfortably.";
};

export { buildFitSummary };
