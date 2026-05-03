const getTone = (status = "") => {
    if (status.includes("tight")) return "tight";
    if (status.includes("loose")) return "loose";
    return "perfect";
};

const formatFitResponse = ({ fitScore, fitType, shortReason, details = {} }) => {
    return {
        percentage: fitScore,
        fitType,
        shortReason,
        details: Object.entries(details).map(([key, val]) => ({
            part: key,
            status: val.status,
            tone: getTone(val.status),
            difference: val.difference,
        })),
    };
};

export { formatFitResponse };
