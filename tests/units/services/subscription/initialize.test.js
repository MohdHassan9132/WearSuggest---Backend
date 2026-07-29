import { test, expect, vi, beforeEach, it } from "vitest";
import { subscriptionService } from "../../../../src/services/subscription/subscription.service.js";
import { resolveSubscriber } from "../../../../src/utils/role.resolver.js";
import { getPlanConfig } from "../../../../src/config/subscriptionPlans.js";
import { subscriptionRepository } from "../../../../src/repositories/subscription.repository.js";
import { razorpayService } from "../../../../src/services/payment/razorpay.service.js";
vi.mock("../../../../src/utils/role.resolver.js", () => {
    return { resolveSubscriber: vi.fn() };
});

vi.mock("../../../../src/config/subscriptionPlans.js", () => {
    return { getPlanConfig: vi.fn() };
});

vi.mock("../../../../src/repositories/subscription.repository.js", () => {
    return {
        subscriptionRepository:{
            create: vi.fn()
        }
    };
});

vi.mock("../../../../src/services/payment/razorpay.service.js", () => ({
    razorpayService: {
        createOrder: vi.fn(),
        verifyPaymentSignature: vi.fn(),
        verifyWebhookSignature: vi.fn(),
    },
}));

const subscriber = {
    subscriberType: "USER",
    userId: "123",
};

const freePlan = {
    name: "FREE",
    credits: 100,
};

beforeEach(() => {
    vi.clearAllMocks();
    resolveSubscriber.mockReturnValue(subscriber);
    getPlanConfig.mockReturnValue(freePlan);
});

it("should initialize subscription", async () => {
    // Arrange
    resolveSubscriber.mockReturnValue(subscriber);

    getPlanConfig.mockReturnValue(freePlan);

    subscriptionRepository.create.mockResolvedValue({
        ...subscriber,
        currentPlan: "FREE",
        credits: 100,
        activatedAt: expect.any(Date),
    });

    // Act
    const result = await subscriptionService.initializeSubscription({
        subscriberId: subscriber.userId,
        role: subscriber.subscriberType,
    });

    expect(resolveSubscriber).toHaveBeenCalledWith({
        subscriberId: "123",
        role: "USER",
    });

    expect(getPlanConfig).toHaveBeenCalledWith({
        role: "USER",
        plan: "FREE",
    });

    expect(subscriptionRepository.create).toHaveBeenCalledWith(
        {
            subscriber,
            subscription: expect.objectContaining({
                currentPlan: "FREE",
            }),
        },
        {}
    );

    // Assert
    expect(result).toEqual({
        ...subscriber,
        currentPlan: "FREE",
        credits: 100,
        activatedAt: expect.any(Date),
    });
});
