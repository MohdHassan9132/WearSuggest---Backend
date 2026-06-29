import { ApiResponse } from "../utils/ApiResponse.js";
import { userService } from "../services/user/user.service.js";
import { sellerService } from "../services/seller/seller.service.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const outfit = asyncHandler(async(req,res)=>{
    console.log("Virtual Try-On controller reached");
    if(req.auth.role === "user"){
        const outfit = await userService.virtualTryOnOutfit(req)
        console.log("returning response",outfit)
        return res.status(200).json(new ApiResponse(200,outfit,"Virtual try on generated successfully"))
    }else if(req.auth.role === "seller"){
        const outfit = await sellerService.virtulTryOnOutfit(req)
        return res.status(200).json(new ApiResponse(200,outfit,"Virtual try on generated successfully"))
    }else{
        throw new ApiError(400,"Invalid User role")
    }
    
   
})
export {
    outfit,
};
