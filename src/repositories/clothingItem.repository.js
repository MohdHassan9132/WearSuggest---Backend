import {ClothingItem} from '../models/clothingItem.model'
import { ApiError } from '../utils/ApiError'
class ClothingItemRepository{
    async findClothImage(id){
        const cloth = await ClothingItem.findById(id)
        if(!cloth){
            throw new ApiError(404,"Cloth not found")
        }
        return{
            url: cloth.imageURL,
            publicId: null
        }
    }
}

export const clothingItemRepository = new ClothingItemRepository()