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
    async deductCredits({
        subscriber,
        cost,
    }){
        return await Subscription.findOneAndUpdate(
            {...subscriber,
                credits:{$gte: cost }
            },
            {
                $inc:{
                    credits: -cost 
                }
            },
            {returnDocument: "after"}
        )
    }
    async addCredits({
        subscriber,
        cost
    }){
        return await Subscription.findOneAndUpdate(
            {
                ...subscriber,
            },
            {
                $inc:{
                    credits: cost
                }
            },
            {returnDocument: "after"}
        )
    }
}

export const subscriptionRepository = new SubscriptionRepository();