import { sellerRepository } from "../../repositories/seller.repository.js";
import { validateAspectRatio } from "../../validators/aspectRatio.validator.js";
import { validatePrompt } from "../../validators/prompt.validator.js";
import { blackAiService } from "../BlackAi/blackAi.service.js";
import { prepareImageSource, resolveImageSource } from '../../utils/image.resolver.js'
import { productRepository } from "../../repositories/product.repository.js";
import { aiModelRepository } from "../../repositories/aiModel.repository.js";
import { uploadFromUrl } from "../../utils/cloudinary.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";
import { subscriptionService } from "../subscription/subscription.service.js";
import { determineSellerFeature } from "../../config/featurePricing.js";
import { cleanupFiles, cleanupImages } from "../../utils/cleanup.js";

class SellerService {
    async virtulTryOnOutfit({
        productId1,
        productId2,
        productId3,
        aiModelId,
        prompt,
        ratio,
        userId,
        files,
        role
    }) {
        if (!productId1) {
            throw new ApiError(400, "At least one existing product is required")
        }
        const validatedPrompt = validatePrompt(prompt)
        const validatedRatio = validateAspectRatio(ratio)
        if (!env.BLACK_AI_KEY) {
            throw new ApiError(503, "This service is currently unavailable")
        }
        const modelSource = prepareImageSource({
            filePath: files.modelPhoto,
            docId: aiModelId,
        });
        const productSources = [
            prepareImageSource({
                filePath: files.product1,
                docId: productId1,
            }),
            prepareImageSource({
                filePath: files.product2,
                docId: productId2,
                required: false
            }),
            prepareImageSource({
                filePath: files.product3,
                docId: productId3,
                required: false
            })
        ]
        const feature = determineSellerFeature({
            products: productSources
        })
        let modelPhoto, product1, product2, product3, chargedCredits
        try {
            chargedCredits = await subscriptionService.charge({
                role,
                subscriberId: userId,
                feature,
            })
                ;[modelPhoto, product1, product2, product3] = await Promise.all([
                    resolveImageSource({
                        source: modelSource,
                        ownerId: userId,
                        fetchImage: aiModelRepository.findModelImageUrl.bind(aiModelRepository)
                    }),
                    resolveImageSource({
                        source: productSources[0],
                        ownerId: userId,
                        fetchImage: productRepository.findProductImageUrl.bind(productRepository)
                    }),
                    resolveImageSource({
                        source: productSources[1],
                        ownerId: userId,
                        fetchImage: productRepository.findProductImageUrl.bind(productRepository)
                    }),
                    resolveImageSource({
                        source: productSources[2],
                        ownerId: userId,
                        fetchImage: productRepository.findProductImageUrl.bind(productRepository)
                    })
                ]);
            const generatedImageUrl = await blackAiService.virtualTryOnOutfit({
                clothingImage1: product1.url,
                clothingImage2: product2?.url,
                clothingImage3: product3?.url,
                modelPhoto: modelPhoto.url,
                prompt: validatedPrompt,
                ratio: validatedRatio
            })
            const virtualTryOnImage = await uploadFromUrl(generatedImageUrl)
            //upload outfit on your own storage
            const product = await productRepository.addVirtualTryOnImage(productId1, userId, virtualTryOnImage)
            return product
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
                files.product1,
                files.product2,
                files.product3
            ])
            await cleanupImages([
                modelPhoto,
                product1,
                product2,
                product3,
            ])
        }
    }
}
export const sellerService = new SellerService()