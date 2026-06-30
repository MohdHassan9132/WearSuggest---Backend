import { VirtualTryOn } from "../models/virtualTryOn.model.js";
class VirtualTryOnRepository{
    async createVirtualTryOnDoc({
        owner,
        cloth1,
        cloth2,
        cloth3,
        virtualTryOnImage,
    }){
        return await VirtualTryOn.create({
            cloth1,
            cloth2,
            cloth3,
            owner,
            virtualTryOnImage,
        })
    }
}

export const virtualTryOnRepository = new VirtualTryOnRepository()