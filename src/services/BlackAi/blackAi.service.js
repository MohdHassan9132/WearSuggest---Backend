import { ApiError } from "../../utils/ApiError.js"

class BlackAiService{
    constructor(apiKey){
        this.baseUrl = "https://thenewblack.ai/api/1.1/wf"
        this.apiKey = apiKey
    }
    async virtualTryOnOutfit({
        clothingImage1,
        clothingImage2,
        clothingImage3,
        modelPhoto,
        prompt,
        ratio
    }){
        
        const url = new URL(`${this.baseUrl}/vto_stream`)
        url.searchParams.append("api_key",this.apiKey)
        const formData = new FormData()
        formData.append("model_photo",modelPhoto)
        formData.append("clothing_photo",clothingImage1)
        formData.append("prompt",prompt)
        formData.append("ratio",ratio)
        if(clothingImage2){
            formData.append("clothing_photo_2",clothingImage2)
        }
        if(clothingImage3){
            formData.append("clothing_photo_3",clothingImage3)
        }
        const response = await fetch(
            url.toString(),{
                method: "POST",
                body: formData
            }
        )
        if(!response.ok){
            throw new ApiError(503,"Try on service unavailable")
        }
        return response;
        
    }
}
export const blackAiService = new BlackAiService()