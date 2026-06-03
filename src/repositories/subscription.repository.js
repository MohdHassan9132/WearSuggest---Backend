import { Subscription }
from "../models/subscirption.model.js";

class SubscriptionRepository {

    async activateSubscription({
        filter,
        credits,
        latestOrderId
    }) {

        return await Subscription
        .findOneAndUpdate(
            filter,
            {
                ...filter,

                latestOrderId,

                $inc: {
                    credits
                }
            },
            {
                upsert: true,
                new: true
            }
        );
    }
    async getSubscription(filter){
        return await Subscription.findOne(filter).populate("latestOrderId")
    }
}

export const subscriptionRepository =
    new SubscriptionRepository();