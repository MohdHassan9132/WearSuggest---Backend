import { stringValidator } from "../validators/string.validator";
export const resolveSubscriber = ({ role, subscriberId }) => {
    const normalizedRole = stringValidator(role).toUpperCase()

    switch (normalizedRole) {
        case "USER":
            return {
                userId: subscriberId
            };

        case "SELLER":
            return {
                sellerId: subscriberId
            };

        default:
            throw new ApiError(
                400,
                `Unsupported subscriber role: ${role}`
            );
    }
};