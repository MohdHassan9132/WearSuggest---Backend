import { SellerSubscription }
from "../models/sellerSubscription.model.js";

class SubscriptionRepository {

    async createSubscription(subscriberId,subscriberType){
        const subscription = await Subscription.create({
            
        })
    }

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