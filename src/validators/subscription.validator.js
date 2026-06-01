export const validateSubscriber = function(next) {
    const hasUser = !!this.userId;
    const hasSeller = !!this.sellerId;

    if (hasUser === hasSeller) {
        return next(
            new Error(
                "Exactly one of userId or sellerId must be provided"
            )
        );
    }

    if (this.subscriberType === "User" && !hasUser) {
        return next(
            new Error(
                "subscriberType User requires userId"
            )
        );
    }

    if (this.subscriberType === "Seller" && !hasSeller) {
        return next(
            new Error(
                "subscriberType Seller requires sellerId"
            )
        );
    }

    next();
};