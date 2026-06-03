import { SubscriptionOrder }
from "../models/subscriptionOrder.model.js";

class SubscriptionOrderRepository {

    async create(payload) {

        return await SubscriptionOrder.create(payload);
    }

    async findByPaymentOrderId(paymentOrderId) {

        return await SubscriptionOrder.findOne({
            paymentOrderId
        });
    }

    async updateStatus({
        paymentOrderId,
        status
    }) {

        return await SubscriptionOrder
        .findOneAndUpdate(
            { paymentOrderId },
            { paymentStatus: status },
            { new: true }
        );
    }
}

export const subscriptionOrderRepository =
    new SubscriptionOrderRepository();