import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";

class ProductRepository{
    async findProductById(id){
        return await Product.findById(id)
    }
    async findProductImageUrl(id){
        const product = await this.findProductById(id)
        if(!product){
            throw new ApiError(404,"Product not found")
        }
        return {
            url: product.media.productImages[0].url,
            publicId: null
        }
    }
}

export const productRepository = new ProductRepository()