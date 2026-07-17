import { ApiResponse } from "../utils/ApiResponse.js";
import { userService } from "../services/user/user.service.js";
import { sellerService } from "../services/seller/seller.service.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const outfit = asyncHandler(async(req,res)=>{
    const {clothId1,clothId2,clothId3,prompt,ratio,aiModelId} = req.body
    const files = {
        modelPhoto: req.files?.modelPhoto?.[0].path,
        cloth1: req.files?.cloth1?.[0]?.path,
        cloth2: req.files?.cloth2?.[0]?.path,
        cloth3: req.files?.cloth3?.[0]?.path
    }
    if(req.auth.role === "user"){
        const vtryOn = await userService.virtualTryOnOutfit({
            userId: req.user._id,
            role: req.auth.role,
            clothId1,
            clothId2,
            clothId3,
            prompt,
            ratio,
            files
        })
        return res.status(200).json(new ApiResponse(200,vtryOn,"Virtual try on generated successfully"))
    }else if(req.auth.role === "seller"){
        const vtryOn = await sellerService.virtulTryOnOutfit({
            userId: req.user._id,
            role: req.auth.role,
            productId1: clothId1,
            productId2: clothId2,
            productId3: clothId3,
            prompt,
            ratio,
            files:{
                modelPhoto: files.modelPhoto,
                product1: files.cloth1,
                product2: files.cloth2,
                product3: files.cloth3
            },
            aiModelId
        })
        return res.status(200).json(new ApiResponse(200,vtryOn,"Virtual try on generated successfully"))
    }else{
        throw new ApiError(400,"Invalid User role")
    }
    
   
})
export {
    outfit,
};
