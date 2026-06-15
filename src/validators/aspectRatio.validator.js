import { ApiError } from "../utils/ApiError.js";
import { stringValidator } from "./string.validator.js";

const VALID_ASPECT_RATIOS = [
    "21:9",
    "16:9",
    "9:16",
    "4:3",
    "3:4",
    "3:2",
    "2:3",
    "4:5",
    "5:4",
    "1:1"
];

export const validateAspectRatio = (aspectRatio = "1:1") => {
    const validatedRatio = stringValidator(aspectRatio);

    if (!VALID_ASPECT_RATIOS.includes(validatedRatio)) {
        throw new ApiError(
            400,
            `Invalid aspect ratio. Supported values: ${VALID_ASPECT_RATIOS.join(", ")}`
        );
    }

    return validatedRatio;
};