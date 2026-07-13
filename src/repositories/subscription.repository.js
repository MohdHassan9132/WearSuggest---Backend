import { Subscription } from "../models/subscription.model.js";

class SubscriptionRepository {

async create(
    { subscriber, subscription },
    { session } = {}
) {
    const subscriptionDoc = new Subscription({
        ...subscriber,
        ...subscription
    });

    await subscriptionDoc.save({ session });

    return subscriptionDoc;
}

    async activate({ subscriber, subscription }) {
        return await Subscription
            .findOneAndUpdate(
                subscriber,
                { $set: subscription },
                { 
                    upsert: true,
                    new: true 
                }
            );
    }

    async get(subscriber) {
        return await Subscription.findOne(subscriber);
    }
}

export const subscriptionRepository = new SubscriptionRepository();