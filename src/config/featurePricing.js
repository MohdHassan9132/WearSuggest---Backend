import { ApiError } from '../utils/ApiError.js';
import {stringValidator} from '../validators/string.validator.js'
export const FEATURE_PRICING = {
    USER: {
        VIRTUAL_TRY_ON: {
            title: "Virtual Try-On",
            cost: 40,
            description: "Virtually try on outfits using your own photo or your AI model."
        }
    },

    SELLER: {
        AI_MODEL_GENERATION: {
            title: "AI Model Generation",
            cost: 20,
            description: "Create a high-resolution AI model from a prompt and a face reference."
        },

        VIRTUAL_TRY_ON: {
            title: "Single Try-On",
            cost: 20,
            description: "Virtually fit a single product onto the selected AI model."
        },

        PRODUCT_TRY_ON: {
            title: "3 Product Try-On",
            cost: 60,
            description: "Generate a complete look using up to 3 products on the selected AI model."
        }
    }
};

export const getFeatureConfig = function({role,feature}){
    const normalizedRole = stringValidator(role).toUpperCase()
    const normalizedFeature = stringValidator(feature).toUpperCase()
    const fetaureConfig = FEATURE_PRICING?.[normalizedRole]?.[normalizedFeature]
    if(!fetaureConfig){
        throw new ApiError(400,"Invalid feature for subscriber")
    }
    return {
        code: normalizedFeature,
        ...fetaureConfig
    }
}
export const determineSellerFeature =function({
    products
}){
    const noOfProducts = products.filter(Boolean).length
    if(noOfProducts>1){
        return getFeatureConfig({
            role: "SELLER",
            feature: "PRODUCT_TRY_ON"
        })
    }
    if(noOfProducts === 1){
        return getFeatureConfig({
            role: "SELLER",
            feature: "VIRTUAL_TRY_ON"
        })
    }
}