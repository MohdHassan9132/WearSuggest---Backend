import { stringValidator } from "../validators/string.validator.js";
export const resolveSubscriber = ({ role, subscriberId }) => {
    const normalizedRole = stringValidator(role).toUpperCase()

    switch (normalizedRole) {
        case "USER":
            return {
                userId: subscriberId,
                subscriberType: "USER"
            };

        case "SELLER":
            return {
                sellerId: subscriberId,
                subscriberType: "SELLER"
            };

        default:
            throw new ApiError(
                400,
                `Unsupported subscriber role: ${role}`
            );
    }
};