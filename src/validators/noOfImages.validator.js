import { validateInteger } from "./number.validator.js";

export const validateNoOfImages = (value) => {
    const count = validateInteger(
        value,
        "Number of images"
    );

    if (count < 1 || count > 4) {
        throw new ApiError(
            400,
            "Number of images must be between 1 and 4"
        );
    }

    return count;
};