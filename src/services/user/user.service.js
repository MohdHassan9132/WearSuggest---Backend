import { ApiError } from "../../utils/ApiError.js";
import { blackAiService } from "../BlackAi/blackAi.service.js";
import { userRepository } from "../../repositories/user.repository.js";
import { imageSourceResolver, modelImageResolver } from "../../utils/image.resolver.js";
import { clothingItemRepository } from '../../repositories/clothingItem.repository.js'
import { deleteFromCloudinary, uploadOnCloudinary } from "../../utils/cloudinary.js";
import { validatePrompt } from '../../validators/prompt.validator.js'
import { validateAspectRatio } from '../../validators/aspectRatio.validator.js'
import { virtualTryOnRepository } from "../../repositories/virtualTryOn.repository.js";
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
                    ownerId: user._id,
                    fetchImage: clothingItemRepository.findClothImage.bind(clothingItemRepository)
                })
            cloth2 = await imageSourceResolver({
                    filePath: req.files?.cloth2?.[0]?.path,
                    docId: cloth2Id,
                    ownerId: user._id,
                    fetchImage: clothingItemRepository.findClothImage.bind(clothingItemRepository)
                })
            cloth3 = await imageSourceResolver({
                    filePath: req.files?.cloth3?.[0]?.path,
                    docId: cloth3Id,
                    ownerId: user._id,
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
