import { env } from "../../config/env.js";
import { aiModelRepository } from "../../repositories/aiModel.repository.js";
import { ApiError } from "../../utils/ApiError.js";

const defaults = {
    resolution: '1k',
    generation_mode: 'fast',
    seed: 42,
    output_format: 'png',
    return_base64: true

}

class FashnApiService {

    constructor() {
        this.baseUrl = "https://api.fashn.ai/v1";
        this.apiKey = env.FASHN_API_KEY;
    }

    async runModel({
        modelName,
        inputs
    }) {

        const response = await fetch(
            `${this.baseUrl}/run`,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${this.apiKey}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    model_name: modelName,
                    inputs
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new ApiError(
                response.status,
                data?.error ||
                "FASHN request failed"
            );
        }

        return data;
    }
    async pollingStatus({
        predictionId
    }){
        const response = await fetch(
            `${this.baseUrl}/status/${predictionId}`,
            {
                method: "GET",
                headers:{
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                }
            }
        )
        const data = await response.json()
        console.log(data)
        if(!response.ok){
            throw new ApiError(
                response.status
                ,data.error
                ||"FASHN request failed"
            )
        }
        return data

    }
    async createModel({//add validation and sanitation and add temp file clear on failure or success
        prompt,
        image,
        aspectRatio,
        noOfImages,
        sellerId,
    }){
        const aiModel = await this.runModel({
            modelName: 'model-create',
            inputs:{
                prompt,
                image_reference: image,
                aspect_ratio: aspectRatio,
                num_images: noOfImages,
                ...defaults
            }
        })
        console.log("from service",aiModel)
        //cdn upload in polling
        if(!aiModel){
            throw new ApiError(503,"Service Unavailable")
        }
        const aiModelDoc = await aiModelRepository.createAiModelDoc({
            sellerId,
            serviceId: aiModel.id,
            status: aiModel.status || "starting",
            error: aiModel.error
        })
        if(aiModel.error !== null){
            throw new ApiError(500,"Internal Server Error")
        }
        console.log("doc in db",aiModelDoc)
        return aiModelDoc
    }
    async pollingModel(serviceId,sellerId){//Add web socket polling once implemented gmail,notification
        const modelDoc = await aiModelRepository.getModelByServiceId(serviceId,sellerId)
        if(!modelDoc){
            throw new ApiError(404,"Request not found")
        }
        if(modelDoc.status === "failed"){
             throw new ApiError(
                503,
                "fash api failed",
                [modelDoc.error]
                )
        }
        if(modelDoc.status === "completed"){
            return modelDoc
        }
        const statusDoc = await this.pollingStatus({predictionId: modelDoc.serviceId})
        //failed
        if(statusDoc.status ==='failed'){
            const updatedModelDoc = await aiModelRepository.updateStatus(modelDoc._id,statusDoc.status,statusDoc.error,null)
            throw new ApiError(
                503,
                "fash api failed",
                [statusDoc.error]
                )
        }
        //completed
        if(statusDoc.status === 'completed'){
            //upload to cdn ex cloudinary. create array for the modelMedia and updated
            const updatedModelDoc = await aiModelRepository.updateStatus(modelDoc._id,statusDoc.status,statusDoc.error,"Array of the base64 images")
            return updatedModelDoc
        }
        if(statusDoc.status === "starting" ||
        statusDoc.status === "in_queue" ||
        statusDoc.status === "processing" 
        ){
            return {status: statusDoc.status}
        }


    }
}

export const fashnApiService = new FashnApiService()