import { VirtualTryOn } from "../models/virtualTryOn.model";
class VirtualTryOnRepository{
    async createVirtualTryOnDoc({
        owner,
        cloth1,
        cloth2,
        cloth3,
        resultImage,
    }){
        return await VirtualTryOn.create({
            cloth1,
            cloth2,
            cloth3,
            owner,
            resultImage
        })
    }
}

export const virtualTryOnRepository = new VirtualTryOnRepository()