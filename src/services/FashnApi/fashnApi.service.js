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
            status: "PENDING",
            error: aiModel.error
        })
        console.log("doc in db",aiModelDoc)
        return aiModelDoc
    }
}

export const fashnApiService = new FashnApiService()