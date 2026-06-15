export const validateInteger = (value, fieldName = "Value") => {
    const number = Number(value);

    if (!Number.isInteger(number)) {
        throw new ApiError(
            400,
            `${fieldName} must be an integer`
        );
    }

    return number;
};