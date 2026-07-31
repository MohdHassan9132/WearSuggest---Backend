import {expect, vi, beforeEach, it } from "vitest";
import { subscriptionService } from "../../../../src/services/subscription/subscription.service.js";
import { resolveSubscriber } from "../../../../src/utils/role.resolver.js";
import { getPlanConfig } from "../../../../src/config/subscriptionPlans.js";
import { subscriptionRepository } from "../../../../src/repositories/subscription.repository.js";
import {builtSubscription,planConfig,userInput} from "../../Fixtures.js";
import { SUBSCRIPTION_PLANS } from "../../../../src/config/subscriptionPlans.js";
vi.mock("../../../../src/utils/role.resolver.js", () => {
    return { resolveSubscriber: vi.fn() };
});

vi.mock("../../../../src/config/subscriptionPlans.js", async () => {
    const actual  = await vi.importActual("../../../../src/config/subscriptionPlans.js");
    return {
        ...actual,
        getPlanConfig: vi.fn() 
    };
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


beforeEach(() => {
    vi.clearAllMocks();
});

it("should return a subscription from planConfig",()=>{
    const buildedSubscription = builtSubscription({
        expiresAt: null
    })
    const result = subscriptionService.buildSubscription(planConfig())
    expect(result).toMatchObject(buildedSubscription)
})

// it("should initialize subscription", async () => {
//     resolveSubscriber.mockReturnValue(resolvedUser);

//     getPlanConfig.mockReturnValue(planConfig);

//     subscriptionRepository.create.mockResolvedValue(userSubscription);
    
//     const subscription = subscriptionService.buildSubscription(planConfig)

//     const result = await subscriptionService.initializeSubscription({
//         subscriberId: userInput.subscriberId,
//         role: userInput.subscriberType,
//     });

//     expect(resolveSubscriber).toHaveBeenCalledWith({
//         subscriberId: userInput.subscriberId,
//         role: userInput.subscriberType,
//     });

//     expect(getPlanConfig).toHaveBeenCalledWith({
//         role: userInput.subscriberType,
//         plan: "FREE",
//     });

//     expect(subscriptionRepository.create).toHaveBeenCalledWith(
//         {
//             subscriber: resolvedUser,
//             subscription: {subscriptionexpect.objectContaining({
//                 currentPlan: "FREE",
//                 credits: SUBSCRIPTION_PLANS.USER.FREE.credits
//             })},
//         },{}    
//     );

//     expect(result).toEqual(userSubscription);
// });
