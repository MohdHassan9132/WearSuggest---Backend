import { Subscription } from "../models/subscirption.model.js";

class SubscriptionRepository {

    async create({ subscriber, subscription }) {
        return await Subscription.create({
            ...subscriber,
            ...subscription
        });
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