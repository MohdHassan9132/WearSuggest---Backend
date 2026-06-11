import {AIModel} from '../models/aiModel.model.js'


class AiModelRepository{
    async createAiModelDoc(data){
        const modelDoc = await AIModel.create(data)
        console.log("from repo",modelDoc)
        return modelDoc
    }
    async updateStatus(){
        const modelDoc = await AIModel.findByIdAndUpdate({},{},{returnDocument: 'after'})
    }
}

export const aiModelRepository = new AiModelRepository()