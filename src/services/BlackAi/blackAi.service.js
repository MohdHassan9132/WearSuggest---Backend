import { ApiError } from "../../utils/ApiError.js"
import { env } from '../../config/env.js'

class BlackAiService {
    constructor(apiKey) {
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
    }) {
        console.log("BlackAiService Reached")
        const url = new URL(`${this.baseUrl}/vto_stream`)
        url.searchParams.append("api_key", this.apiKey)
        const formData = new FormData()
        formData.append("model_photo", modelPhoto)
        formData.append("clothing_photo", clothingImage1)
        formData.append("prompt", prompt)
        formData.append("ratio", ratio)
        if (clothingImage2) {
            formData.append("clothing_photo_2", clothingImage2)
        }
        if (clothingImage3) {
            formData.append("clothing_photo_3", clothingImage3)
        }
        console.log("request send to black ai")
        const response = await fetch(url.toString(), {
            method: "POST",
            body: formData
        });
        console.log("response recieved from blackai")

        const text = await response.text();

        if (!response.ok) {
            throw new ApiError(response.status, text);
        }

        return text;

    }
}
export const blackAiService = new BlackAiService(env.BLACK_AI_KEY)