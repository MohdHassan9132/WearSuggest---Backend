import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";

class ProductRepository{
    async findProductById(id){
        return await Product.findById(id)
    }
    async findProductImageUrl(id,ownerId){
        const product = await Product.findOne({
            _id: id,
            seller: ownerId
        })
        if(!product){
            throw new ApiError(404,"Product not found")
        }
        return {
            url: product.media?.productImages?.[0].url,
            publicId: null
        }
    }
    async findProductByIdAndAddVtryOnImage(id,sellerId,url,publicId){
        const product = await Product.findOneAndUpdate(
            {
                _id: id,
                seller: sellerId
            },
            {
                $push:{
                   "media.aiModelPreview":{
                    url,
                    publicId
                   }
                }
            },
            {returnDocument: "after"}
        )
        if(!product){
            throw new ApiError(404,"Product not found")
        }
        return product
    }
    
}

export const productRepository = new ProductRepository()