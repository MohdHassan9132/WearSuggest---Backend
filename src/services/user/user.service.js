import { ApiError } from "../../utils/ApiError.js";
import { blackAiService } from "../BlackAi/blackAi.service.js";
import { userRepository } from "../../repositories/user.repository.js";
import { prepareImageSource, resolveImageSource, modelImageResolver } from "../../utils/image.resolver.js";
import { clothingItemRepository } from '../../repositories/clothingItem.repository.js'
import { uploadFromUrl } from "../../utils/cloudinary.js";
import { validatePrompt } from '../../validators/prompt.validator.js'
import { validateAspectRatio } from '../../validators/aspectRatio.validator.js'
import { virtualTryOnRepository } from "../../repositories/virtualTryOn.repository.js";
import { env } from "../../config/env.js";
import { subscriptionService } from "../subscription/subscription.service.js";
import { cleanupFiles, cleanupImages } from "../../utils/cleanup.js";
import { getFeatureConfig } from "../../config/featurePricing.js";
class UserService {
    async virtualTryOnOutfit({
        userId,
        role,
        clothId1,
        clothId2,
        clothId3,
        prompt,
        ratio,
        files
    }) {
        if (!env.BLACK_AI_KEY) {
            throw new ApiError(503, "This service is currently unavailable")
        }
        const validatedPrompt = validatePrompt(prompt)
        const validatedRatio = validateAspectRatio(ratio)
        const clothSources = [
            prepareImageSource({
                filePath: files.cloth1,
                docId: clothId1
            }),
            prepareImageSource({
                filePath: files.cloth2,
                docId: clothId2
            }),
            prepareImageSource({
                filePath: files.cloth3,
                docId: clothId3,
                required: false
            })
        ]
        const feature = getFeatureConfig({
            role,
            feature: "VIRTUAL_TRY_ON"
        })
        let modelPhoto, cloth1, cloth2, cloth3, chargedCredits
        try {
            const user = await userRepository.findUserById(userId)
            modelPhoto = await modelImageResolver({
                user,
                filePath: files.modelPhoto
            })

            chargedCredits = await subscriptionService.charge({
                role,
                subscriberId: user._id,
                feature
            })
                ;[cloth1, cloth2, cloth3] = await Promise.all([
                    resolveImageSource({
                        source: clothSources[0],
                        ownerId: user._id,
                        fetchImage: clothingItemRepository.findClothImage.bind(clothingItemRepository)
                    }),
                    resolveImageSource({
                        source: clothSources[1],
                        ownerId: user._id,
                        fetchImage: clothingItemRepository.findClothImage.bind(clothingItemRepository)
                    }),
                    resolveImageSource({
                        source: clothSources[2],
                        ownerId: user._id,
                        fetchImage: clothingItemRepository.findClothImage.bind(clothingItemRepository)
                    })
                ]);
            const generatedImageUrl = await blackAiService.virtualTryOnOutfit({
                clothingImage1: cloth1.url,
                clothingImage2: cloth2.url,
                clothingImage3: cloth3?.url,
                modelPhoto: modelPhoto.url,
                prompt: validatedPrompt,
                ratio: validatedRatio
            })
            const virtualTryOnImage = await uploadFromUrl(generatedImageUrl)
            const vtryOn = await virtualTryOnRepository.createVirtualTryOnDoc({
                owner: userId,
                cloth1: clothId1,
                cloth2: clothId2,
                cloth3: clothId3,
                virtualTryOnImage
            })
            return vtryOn;
        } catch (error) {
            if (chargedCredits) {
                try {
                    await subscriptionService.refund({
                        role,
                        subscriberId: userId,
                        cost: chargedCredits.chargedCost
                    })
                } catch (error) {
                    console.error("Refund Error", error)
                }
            }
            throw error
        } finally {
            cleanupFiles([
                files.modelPhoto,
                files.cloth1,
                files.cloth2,
                files.cloth3
            ])
            await cleanupImages([
                modelPhoto,
                cloth1,
                cloth2,
                cloth3
            ])
        }
    }
}
export const userService = new UserService();
