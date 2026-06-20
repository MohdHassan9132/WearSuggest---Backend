import { User } from "../models/user.model";
import { subscriptionRepository } from "./subscription.repository";
import { SUBSCRIPTION_PLANS } from "../config/subscriptionPlans";

class UserRespository{
    async createUserDoc({
        username,
        email,
        password,
        bodyMeasuremtns=null,
        footsize=null
    }){
        const userDoc = await User.create({
            username,
            email,
            password,
            bodyMeasurements,
            footsize
        })
        await subscriptionRepository.activateSubscription({
            filter:{
                userId: userDoc._id,
                userType: "USER"
            },
            credits: SUBSCRIPTION_PLANS.USER.FREE.credits,
            latestOrderId: null
        })
    }
}