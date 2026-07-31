import { vi, expect,it, beforeEach } from "vitest";
import { subscriptionRepository } from "../../../../src/repositories/subscription.repository.js";
import { resolveSubscriber } from "../../../../src/utils/role.resolver.js";
import { subscriptionService } from "../../../../src/services/subscription/subscription.service.js";
import {resolvedSeller, resolvedUser, sellerInput, sellerSubscription, userInput, userInput, userSubscription} from '../../Fixtures.js'
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

it("should return users current plan", async () => {
    const resolved = resolvedUser()
    resolveSubscriber.mockReturnValue(resolved);
    const subscription = userSubscription({expiresAt: null})
    subscriptionRepository.get.mockResolvedValue(subscription);
    const input = userInput()
    const result = await subscriptionService.getCurrentPlan({
        role: input.subscriberType,
        subscriberId: input.subscriberId
    });
    expect(resolveSubscriber).toHaveBeenCalledWith({
        role: input.subscriberType,
        subscriberId: input.subscriberId
    });
    expect(subscriptionRepository.get).toHaveBeenCalledWith(resolved);
    expect(result).toEqual(subscription)
});


it("should throw error for no subscription", async () => {
    const seller = resolvedSeller()
    resolveSubscriber.mockReturnValue(seller)
    subscriptionRepository.get.mockResolvedValue(null)
    await expect(
        subscriptionService.getCurrentPlan({
        role: seller.subscriberType,
        subscriberId: sellerInput.subscriberId
    })
    ).rejects.toThrow("subscription not found")
    expect(resolveSubscriber).toHaveBeenCalledWith({
        role: seller.subscriberType,
        subscriberId: seller.subscriberId
    })
    expect(subscriptionRepository.get).toHaveBeenCalledWith(seller)
})

