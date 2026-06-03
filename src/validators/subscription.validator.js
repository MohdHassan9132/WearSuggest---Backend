export const validateSubscriber = function() {

    const hasUser = !!this.userId;
    const hasSeller = !!this.sellerId;

    if (hasUser === hasSeller) {

        throw new Error(
            "Exactly one of userId or sellerId must be provided"
        );
    }

    if (
        this.subscriberType === "USER" &&
        !hasUser
    ) {

        throw new Error(
            "subscriberType USER requires userId"
        );
    }

    if (
        this.subscriberType === "SELLER" &&
        !hasSeller
    ) {

        throw new Error(
            "subscriberType SELLER requires sellerId"
        );
    }
};