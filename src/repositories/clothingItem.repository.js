import {ClothingItem} from '../models/clothingItem.model.js'
import { ApiError } from '../utils/ApiError.js'
class ClothingItemRepository{
    async findClothImage(id,ownerId){
        const cloth = await ClothingItem.findOne({
            _id: id,
            owner: ownerId
        })
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