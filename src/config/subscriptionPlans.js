import { ApiError } from "../utils/ApiError.js";
import {stringValidator} from '../validators/string.validator.js'

export const SUBSCRIPTION_PLANS = {
    USER: {
        FREE: {
            amount: 0,
            credits: 100,
            currency: "INR"
        },
        PRO: {
            amount: 19900,
            credits: 500,
            currency: "INR"
        }
    },
    SELLER: {
        FREE: {
            amount: 0,
            credits: 100,
            currency: null
        },
        PRO: {
            amount: 180000,
            credits: 1200,
            currency: "INR"
        },
        BRAND: {
            amount: 470000,
            credits: 4000,
            currency: "INR"
        }
    }
};

export const getPlanConfig = ({ role, plan }) => {
    const normalizedRole =
        stringValidator(role).toUpperCase();

    const normalizedPlan =
        stringValidator(plan).toUpperCase();
    const selectedPlan = SUBSCRIPTION_PLANS[normalizedRole]?.[normalizedPlan];
    
    if (!selectedPlan) {
        throw new ApiError(400, "Invalid Plan");
    }
    
    return {
        name: normalizedPlan,
        ...selectedPlan
    };
};