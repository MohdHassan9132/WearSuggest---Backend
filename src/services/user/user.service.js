import { ApiError } from "../../utils/ApiError";
import { blackAiService } from "../BlackAi/BlackAi.service";
import { userRepository } from "../../repositories/user.repository";
import { imageSourceResolver, modelImageResolver } from "../../utils/image.resolver";
import { clothingItemRepository } from '../../repositories/clothingItem.repository'
import { deleteFromCloudinary, uploadOnCloudinary } from "../../utils/cloudinary";
import { validatePrompt } from '../../validators/prompt.validator'
import { validateAspectRatio } from '../../validators/aspectRatio.validator'
import { virtualTryOnRepository } from "../../repositories/virtualTryOn.repository";
import fs from 'fs'
class UserService {
    async virtualTryOnOutfit(req) {
        const { cloth1Id, cloth2Id, cloth3Id, prompt, ratio } = req.body;
        const validatedPrompt = validatePrompt(prompt)
        const validatedRatio = validateAspectRatio(ratio)
        let modelPhoto, cloth1, cloth2, cloth3
        try {
            const user = await userRepository.findUserById(req.user._id);
            modelPhoto = await modelImageResolver({
                    user,
                    filePath: req.files?.modelPhoto?.[0]?.path
                })
            cloth1 = await imageSourceResolver({
                    filePath: req.files?.cloth1?.[0]?.path,
                    docId: cloth1Id,
                    fetchImage: clothingItemRepository.findClothImage.bind(clothingItemRepository)
                })
            cloth2 = await imageSourceResolver({
                    filePath: req.files?.cloth2?.[0]?.path,
                    docId: cloth2Id,
                    fetchImage: clothingItemRepository.findClothImage.bind(clothingItemRepository)
                })
            cloth3 = await imageSourceResolver({
                    filePath: req.files?.cloth3?.[0]?.path,
                    docId: cloth3Id,
                    required: false,
                    fetchImage: clothingItemRepository.findClothImage.bind(clothingItemRepository)
                })
            const outfit = await blackAiService.virtualTryOnOutfit({
                clothingImage1: cloth1.url,
                clothingImage2: cloth2.url,
                clothingImage3: cloth3.url,
                modelPhoto: modelPhoto.url,
                prompt: validatedPrompt,
                ratio: validatedRatio
            })
            //upload of outfit variable on cloudinary left
            const vtryOn = await virtualTryOnRepository.createVirtualTryOnDoc({
                owner: req.user._id,
                cloth1: cloth1Id,
                cloth2: cloth2Id,
                cloth3: cloth3Id,
                resultImage: outfit
            })
            return vtryOn;
        } catch (error) {
            throw error
        } finally {
            const temporaryImages = [
                modelPhoto,
                cloth1,
                cloth2,
                cloth3,
            ];

            for (const image of temporaryImages) {
                if (image?.publicId) {
                    await deleteFromCloudinary(image.publicId);
                }
            }
        }



    }
}
export const userService = new UserService();
