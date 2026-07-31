function createSubscriptionDates(durationInDays = null) {
    const activatedAt = new Date();

    let expiresAt = null;

    if (durationInDays !== null) {
        expiresAt = new Date(activatedAt);
        expiresAt.setDate(expiresAt.getDate() + durationInDays);
    }

    return { activatedAt, expiresAt };
}

export const planConfig = (overrides = {}) => ({
    name: "FREE",
    amount: 0,
    credits: 100,
    currency: null,
    ...overrides,
});

export const userInput = (overrides = {}) => ({
    subscriberId: "user123",
    subscriberType: "USER",
    ...overrides,
});

export const resolvedUser = (overrides = {}) => ({
    userId: "user123",
    subscriberType: "USER",
    ...overrides,
});

export const sellerInput = (overrides = {}) => ({
    subscriberId: "seller123",
    subscriberType: "SELLER",
    ...overrides,
});

export const resolvedSeller = (overrides = {}) => ({
    sellerId: "seller123",
    subscriberType: "SELLER",
    ...overrides,
});

export const invalidSubscriber = (overrides = {}) => ({
    userId: "user123",
    subscriberType: "ADMIN",
    ...overrides,
});

export const builtSubscription = (overrides = {}) => {
    const { activatedAt, expiresAt } = createSubscriptionDates();

    return {
        currentPlan: "FREE",
        credits: 100,
        activatedAt,
        expiresAt,
        ...overrides,
    };
};

export const userSubscription = (overrides = {}) => {
    const { activatedAt, expiresAt } = createSubscriptionDates(30);

    return {
        userId: "user123",
        subscriberType: "USER",
        currentPlan: "FREE",
        credits: 100,
        activatedAt,
        expiresAt,
        ...overrides,
    };
};

export const sellerSubscription = (overrides = {}) => {
    const { activatedAt, expiresAt } = createSubscriptionDates(30);

    return {
        sellerId: "seller123",
        subscriberType: "SELLER",
        currentPlan: "FREE",
        credits: 100,
        activatedAt,
        expiresAt,
        ...overrides,
    };
};