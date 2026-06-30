import { sellerRepository } from "../../repositories/seller.repository.js";
import { validateAspectRatio } from "../../validators/aspectRatio.validator.js";
import { validatePrompt } from "../../validators/prompt.validator.js";
import { blackAiService } from "../BlackAi/blackAi.service.js";
import {imageSourceResolver} from '../../utils/image.resolver.js'
import { productRepository } from "../../repositories/product.repository.js";
import { aiModelRepository } from "../../repositories/aiModel.repository.js";
import { deleteFromCloudinary, uploadFromUrl } from "../../utils/cloudinary.js";

class SellerService{
    async virtulTryOnOutfit(req){
        const {productId1,productId2,productId3,aiModelId,prompt,ratio} = req.body
        const validatedPrompt = validatePrompt(prompt)
        const validatedRatio = validateAspectRatio(ratio)
        let modelPhoto,product1,product2,product3;
        try {
            const seller = await sellerRepository.findSellerByField("_id",req.user._id)
            modelPhoto = await imageSourceResolver({
                filePath: req.files?.modelPhoto?.[0].path,
                docId: aiModelId,
                ownerId: seller._id,
                fetchImage: aiModelRepository.findModelImageUrl.bind(aiModelRepository)
            })
            product1 = await imageSourceResolver({
                filePath: req.files?.cloth1?.[0].path,
                docId: productId1,
                ownerId: seller._id,
                fetchImage: productRepository.findProductImageUrl.bind(productRepository)
            })
            product2 = await imageSourceResolver({
                filePath: req.files?.cloth2?.[0].path,
                docId: productId2,
                ownerId: seller._id,
                required: false,
                fetchImage: productRepository.findProductImageUrl.bind(productRepository)
            })
            product3 = await imageSourceResolver({
                filePath: req.files?.cloth3?.[0].path,
                docId: productId3,
                ownerId: seller._id,
                required: false,
                fetchImage: productRepository.findProductImageUrl.bind(productRepository)
            })
            const generatedImageUrl = await blackAiService.virtualTryOnOutfit({
                clothingImage1: product1.url,
                clothingImage2: product2?.url,
                clothingImage3: product3?.url,
                modelPhoto: modelPhoto.url,
                prompt: validatedPrompt,
                ratio: validatedRatio
            })
           const virtualTryOnImage = await uploadFromUrl(generatedImageUrl)
            //upload outfit on your own storage
            const product = await productRepository.addVirtualTryOnImage(productId1,seller._id,virtualTryOnImage)
            return product
        } catch (error) {
            throw error
        }finally{
            const temporaryImages = [
            modelPhoto,
            product1,
            product2,
            product3
            ]
            for(const image of temporaryImages){
                if(image?.publicId){
                    await deleteFromCloudinary(image.publicId)
                }
            }
        }


    }
}
export const sellerService = new SellerService()