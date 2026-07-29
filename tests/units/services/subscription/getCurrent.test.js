import { vi, expect, test, it, beforeEach } from "vitest";
import { razorpayService } from "../../../../src/services/payment/razorpay.service.js";
import { subscriptionRepository } from "../../../../src/repositories/subscription.repository.js";
import { resolveSubscriber } from "../../../../src/utils/role.resolver.js";
import { subscriptionService } from "../../../../src/services/subscription/subscription.service.js";
beforeEach(() => {
    vi.clearAllMocks();
});

vi.mock("../../../../src/services/payment/razorpay.service.js", () => {
    return {
        razorpayService: {
            createOrder: vi.fn(),
            verifyPaymentSignature: vi.fn(),
            verifyWebhookSignature: vi.fn(),
        },
    };
});

vi.mock("../../../../src/repositories/subscription.repository.js", () => {
    return {
        subscriptionRepository: {
            get: vi.fn(),
        },
    };
});

vi.mock("../../../../src/utils/role.resolver.js", () => {
    return { resolveSubscriber: vi.fn() };
});

const subscriber = {
    subscriberId: "user123",
    subscriberType: "USER",
};
const subscription = {
    userId: "user123",
    subscriberType: "USER",
    currentPlan: "FREE",
    credits: 100,
    activatedAt: new Date()
}
it("should return users current plan", async () => {
    resolveSubscriber.mockReturnValue(subscriber);
    subscriptionRepository.get.mockResolvedValue(subscription);
    const result = await subscriptionService.getCurrentPlan({
        role: subscriber.subscriberType,
        subscriberId: subscriber.subscriberId
    });
    expect(resolveSubscriber).toHaveBeenCalledWith({
        role: subscriber.subscriberType,
        subscriberId: subscriber.subscriberId
    });
    expect(subscriptionRepository.get).toHaveBeenCalledWith(subscriber);
    expect(result).toEqual(subscription)
});

beforeEach(() => {
    vi.clearAllMocks();
});
it("should throw error for wrong ")
