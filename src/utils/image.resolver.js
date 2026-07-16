import { ApiError } from './ApiError.js'
import mongoose from 'mongoose'
import { uploadOnCloudinary } from './cloudinary.js'
export const prepareImageSource = ({
    filePath,
    docId,
    required = true
}) => {
    const hasFile = !!filePath;
    const hasDoc = mongoose.Types.ObjectId.isValid(docId);

    if (hasFile && hasDoc) {
        throw new ApiError(
            400,
            "Only one image source is allowed"
        );
    }

    if (!hasFile && !hasDoc) {
        if (required) {
            throw new ApiError(
                400,
                "Image source is required"
            );
        }

        return null;
    }

    if (hasFile) {
        return {
            type: "FILE",
            value: filePath
        };
    }

    return {
        type: "DOCUMENT",
        value: docId
    };
};

export const resolveImageSource = async ({
    source,
    ownerId,
    fetchImage
}) => {
    if (!source) {
        return null;
    }

    if (source.type === "FILE") {
        const image = await uploadOnCloudinary(
            source.value
        );

        return {
            url: image.secure_url,
            publicId: image.public_id
        };
    }

    if (source.type === "DOCUMENT") {
        return await fetchImage(
            source.value,
            ownerId
        );
    }

    throw new ApiError(
        400,
        "Invalid image source type"
    );
};

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