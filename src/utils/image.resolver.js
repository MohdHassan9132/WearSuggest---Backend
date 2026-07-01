import { ApiError } from './ApiError.js'
import mongoose from 'mongoose'
import { uploadOnCloudinary } from './cloudinary.js'
export const imageSourceResolver = async function ({
    filePath,
    docId,
    ownerId,
    required = true,
    fetchImage
}) {
    const hasFile = !!filePath
    const hasDoc = mongoose.Types.ObjectId.isValid(docId)
    //required acts as a boolean to throw error or not if the input is required or not 
    if (hasFile && hasDoc) {
        throw new ApiError(400, "Only one is acceptable. Image or ClothingItem")
    }
    if (!hasFile && !hasDoc && required) {
        throw new ApiError(400, "One clothing item is required for vtryOn")
    }
    if (!hasFile && !hasDoc && !required) {
        return null
    }
    if (hasFile) {
        const image = await uploadOnCloudinary(filePath)
        return { url: image.secure_url, publicId: image.public_id }

    }
    if (hasDoc) {
        return await fetchImage(docId,ownerId)
    }
}
export const modelImageResolver = async function modelImageResolver({
    user,
    filePath
}) {
    const hasImage = !!user?.image?.secureUrl
    const hasFile = !!filePath
    if (!hasFile && !hasImage) {
        throw new ApiError(400, "At least one is requried. either upload file or add image in ur profile")
    }
    if (hasFile) {
        const uploadedImage = await uploadOnCloudinary(filePath)
        return {
            url: uploadedImage.secure_url,
            publicId: uploadedImage.public_id
        }
    }
    return {
        url: user.image.secureUrl,
        publicId: null
    }
}