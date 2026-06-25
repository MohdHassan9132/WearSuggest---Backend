import {AIModel} from '../models/aiModel.model.js'


class AiModelRepository{
    async createAiModelDoc(data){
        const modelDoc = await AIModel.create(data)
        console.log("from repo",modelDoc)
        return modelDoc
    }
    async updateStatus(modeldocId,status,error,ModelMedia){
        const modelDoc = await AIModel.findByIdAndUpdate(modeldocId,{
            status,
            error,
            ModelMedia
        },{returnDocument: 'after'})
        return modelDoc
    }
    async getModelByServiceId(serviceId,sellerId){
        const modelDoc = await AIModel.findOne({serviceId,sellerId})
        return modelDoc
    }
    async getModelById(id){
        const model = await AIModel.findById(id)
        return model
    }
}

export const aiModelRepository = new AiModelRepository()