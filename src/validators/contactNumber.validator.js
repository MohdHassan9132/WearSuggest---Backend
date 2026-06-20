import { ApiError } from "../utils/ApiError.js";
import { stringValidator } from "./string.validator.js";

export const phoneValidator = function (phone) {
    const validatedPhone = stringValidator(phone);

    const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;
    //can user library for internation numbers as well
    if (!phoneRegex.test(validatedPhone)) {
        throw new ApiError(
            400,
            "Invalid Indian mobile number"
        );
    }

    return validatedPhone;
};