import Razorpay from "razorpay";
import crypto from "crypto";

import { env } from "../../config/env.js";

class RazorpayService {

    constructor() {

        this.instance = new Razorpay({
            key_id: env.RAZORPAY.ID,
            key_secret: env.RAZORPAY.SECRET
        });
    }

    async createOrder(options) {

        return await this.instance.orders.create(options);
    }

    verifyPaymentSignature({
        orderId,
        paymentId,
        signature
    }) {

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                env.RAZORPAY.SECRET
            )
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        return generatedSignature === signature;
    }

verifyWebhookSignature({
    rawBody,
    signature
}) {

    const expectedSignature = crypto
        .createHmac(
            "sha256",
            env.RAZORPAY.WEBHOOK_SECRET
        )
        .update(rawBody)
        .digest("hex");

    return expectedSignature === signature;
}
}

export const razorpayService =
    new RazorpayService();