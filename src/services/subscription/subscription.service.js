import { ApiError } from "../../utils/ApiError.js";
import { getPlanConfig } from "../../config/subscriptionPlans.js";
import { razorpayService } from "../payment/razorpay.service.js";
import { subscriptionOrderRepository } from "../../repositories/subscriptionOrder.respository.js";
import { subscriptionRepository } from "../../repositories/subscription.repository.js";
import { resolveSubscriber } from "../../utils/role.resolver.js";
import {FEATURE_PRICING,getFeatureConfig} from '../../config/featurePricing.js'

class SubscriptionService {

    async createSubscriptionOrder({ subscriberId, role, plan }) {
        const planConfig = getPlanConfig({ role, plan });

        if (planConfig.name === "FREE") {
            throw new ApiError(
                400,
                "Free plan cannot be purchased."
            );
        }

        const razorpayOrder = await razorpayService.createOrder({
            amount: planConfig.amount,
            currency: planConfig.currency
        });

        const subscriber = resolveSubscriber({ role, subscriberId });
        const subscriptionDetails = this.buildSubscriptionOrder(planConfig);
        const subscriptionOrder = this.razorpayOrderToSubscriptionOrder(razorpayOrder);

        const order = await subscriptionOrderRepository.create({
            subscriber,
            subscription: subscriptionDetails,
            order: subscriptionOrder
        });

        return { order, razorpayOrder };
    }

    async verifyFrontendPayment(data) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

        const isValid = razorpayService.verifyPaymentSignature({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
        });

        if (!isValid) {
            throw new ApiError(400, "Invalid payment signature");
        }

        const order = await subscriptionOrderRepository.findByPaymentOrderId(razorpay_order_id);

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        order.paymentId = razorpay_payment_id;
        order.paymentSignature = razorpay_signature;

        await order.save();

        return { verified: true, awaitingWebhook: true };
    }

    async initializeSubscription({ subscriberId, role }, { options } = {}) {
        const subscriber = resolveSubscriber({ role, subscriberId });
        const planConfig = getPlanConfig({ role: subscriber.subscriberType, plan: "FREE" });
        const subscription = this.buildSubscription(planConfig);

        return await subscriptionRepository.create({
            subscriber,
            subscription
        },options);
    }

    async activateSubscription(order) {
        const subscriber = resolveSubscriber({
            role: order.subscriberType,
            subscriberId: order.userId || order.sellerId
        });

        const planConfig = getPlanConfig({
            role: order.subscriberType,
            plan: order.plan
        });
        const subscription = this.buildSubscription(planConfig);

        return await subscriptionRepository.activate({
            subscriber,
            subscription
        });
    }

    async verifyWebhook(req) {
        const signature = req.headers["x-razorpay-signature"];

        const isValid = razorpayService.verifyWebhookSignature({
            rawBody: req.body,
            signature
        });

        if (!isValid) {
            throw new ApiError(400, "Invalid webhook signature");
        }

        const payload = JSON.parse(req.body.toString());
        const event = payload.event;

        if (event !== "payment.captured") {
            return;
        }

        const payment = payload.payload.payment.entity;
        const orderId = payment.order_id;

        const order = await subscriptionOrderRepository.findByPaymentOrderId(orderId);

        if (!order || order.paymentStatus === "success") {
            return;
        }

        order.paymentStatus = "success";
        await order.save();

        await this.activateSubscription(order);
    }
    async charge({role,subscriberId,feature}){
        const subscriber = resolveSubscriber({
            role,
            subscriberId
        })

        const subscription = await subscriptionRepository.deductCredits({
            subscriber,
            cost: feature.cost 
        })
        if(!subscription){
            throw new ApiError(402,"Insufficient credits")
        }
        return {
            chargedCost: feature.cost
        }
    }
    async refund({role,subscriberId,cost}){
        const subscriber = resolveSubscriber({
            role,
            subscriberId
        })
        const subscription = await subscriptionRepository.addCredits({
            subscriber,
            cost
        })
        if(!subscription){
            throw new ApiError(404,"subscription nout found")
        }
        return subscription

    }

    async getCurrentPlan({ role, subscriberId }) {
        const subscriber = resolveSubscriber({ role, subscriberId });
        const plan =  await subscriptionRepository.get(subscriber);
        if(!plan){
            throw new ApiError(404,"subscription not found")
        }
        return plan
    }

    razorpayOrderToSubscriptionOrder(razorpayOrder) {
        return {
            paymentService: "Razorpay",
            paymentOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            amountPaid: razorpayOrder.amount_paid,
            paymentStatus: razorpayOrder.status
        };
    }

    buildSubscriptionOrder(planConfig) {
        return {
            plan: planConfig.name,
            credits: planConfig.credits,
            amount: planConfig.amount
        };
    }

    buildSubscription(planConfig) {
        const activatedAt = new Date();
        let expiresAt = null;

        if (planConfig.name !== "FREE") {
            expiresAt = new Date(activatedAt);
            expiresAt.setDate(expiresAt.getDate() + 30);
        }

        return {
            currentPlan: planConfig.name,
            credits: planConfig.credits,
            activatedAt,
            expiresAt
        };
    }
}

export const subscriptionService = new SubscriptionService();