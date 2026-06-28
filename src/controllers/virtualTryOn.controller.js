import { ApiResponse } from "../utils/ApiResponse.js";
import { userService } from "../services/user/user.service.js";
import { sellerService } from "../services/seller/seller.service.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const outfit = asyncHandler(async(req,res)=>{
    if(req.auth.role === "USER"){
        const outfit = await userService.virtualTryOnOutfit(req)
        return res.status(200).json(new ApiResponse(200,outfit,"Virtual try on generated successfully"))
    }
    if(req.auth.role === "SELLER"){
        const outfit = await sellerService.virtulTryOnOutfit(req)
        return res.status(200).json(new ApiResponse(200,outfit,"Virtual try on generated successfully"))
    }
   
})
export {
    outfit,
};
