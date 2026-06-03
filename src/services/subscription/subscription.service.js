import { ApiError }
from "../../utils/ApiError.js";

import { SUBSCRIPTION_PLANS }
from "../../configs/subscriptionPlans.js";

import { razorpayService }
from "../payment/razorpay.service.js";

import { subscriptionOrderRepository }
from "../../repositories/subscriptionOrder.repository.js";

import { subscriptionRepository }
from "../../repositories/subscription.repository.js";

import { resolveSubscriberPayload }
from "../../utils/roleResolver.js";

class SubscriptionService {

    async createSubscriptionOrder({
        subscriberId,
        role,
        plan
    }) {

        const roleKey = role.toUpperCase();

        const selectedPlan =
            SUBSCRIPTION_PLANS[roleKey]?.[plan];

        if (!selectedPlan) {
            throw new ApiError(
                400,
                "Invalid subscription plan"
            );
        }

        const razorpayOrder =
            await razorpayService.createOrder({
                amount: selectedPlan.amount,
                currency: selectedPlan.currency
            });

        const subscriberPayload =
            resolveSubscriberPayload({
                role: roleKey,
                subscriberId
            });

        const orderPayload = {

            ...subscriberPayload,

            subscriberType: roleKey,

            credits: selectedPlan.credits,

            tier: plan,

            paymentService: "Razorpay",

            paymentOrderId: razorpayOrder.id,

            amountPaid: razorpayOrder.amount,

            paymentStatus: "created"
        };

        const order =
            await subscriptionOrderRepository
            .create(orderPayload);

        return {
            order,
            razorpayOrder
        };
    }

    async verifyFrontendPayment(data) {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = data;

        const isValid =
            razorpayService
            .verifyPaymentSignature({
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature
            });

        if (!isValid) {
            throw new ApiError(
                400,
                "Invalid payment signature"
            );
        }

        const order =
            await subscriptionOrderRepository
            .findByPaymentOrderId(
                razorpay_order_id
            );

        if (!order) {
            throw new ApiError(
                404,
                "Order not found"
            );
        }

        order.paymentId = razorpay_payment_id;

        order.paymentSignature =
            razorpay_signature;

        await order.save();

        return {
            verified: true,
            awaitingWebhook: true
};
    }

    async activateSubscription(order) {

        const filter =
            resolveSubscriberPayload({
                role: order.subscriberType,
                subscriberId:
                    order.userId || order.sellerId
            });

        return await subscriptionRepository
            .activateSubscription({

                filter,

                credits: order.credits,

                latestOrderId: order._id
            });
    }

async verifyWebhook(req) {

    const signature =
        req.headers["x-razorpay-signature"];

    const isValid =
        razorpayService
        .verifyWebhookSignature({

            rawBody: req.body,

            signature
        });

    if (!isValid) {

        throw new ApiError(
            400,
            "Invalid webhook signature"
        );
    }

    const payload =
        JSON.parse(req.body.toString());

    const event = payload.event;

    if (event !== "payment.captured") {
        return;
    }

    const payment =
        payload.payload.payment.entity;

    const orderId = payment.order_id;

        const order =
            await subscriptionOrderRepository
            .findByPaymentOrderId(orderId);

        if (!order) {
            return;
        }

        if (order.paymentStatus === "success") {
            return;
        }

        order.paymentStatus = "success";

        await order.save();

        await this.activateSubscription(order);
    }
}

export const subscriptionService =
    new SubscriptionService();