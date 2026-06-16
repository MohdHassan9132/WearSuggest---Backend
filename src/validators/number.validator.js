
export const validateInteger = (value, fieldName = "Value") => {
    console.log(typeof  value,value)
    const number = Number(value);
    console.log(number,typeof number)

    if (!Number.isInteger(number)) {
        throw new ApiError(
            400,
            `${fieldName} must be an integer`
        );
    }

    return number;
};