import { stringValidator } from "./string.validator";

export const validatePassword = function validatePassword(password){
    const validatedPassword = stringValidator(password)
     const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}\-_=+\\|;:'",<.>/?`~]).{8,}$/;

    if (!passwordRegex.test(validatedPassword)) {
        throw new ApiError(
            400,
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
        );
    }

    return validatedPassword; 
}