import fs from 'fs'
import {deleteFromCloudinary} from '../utils/cloudinary.js'
export const cleanupImages = async (temporaryImages) => {
    if (!Array.isArray(temporaryImages)) {
        console.warn("cleanupImages expected an array");
        return;
    }

    for (const image of temporaryImages) {
        try {
            if (image?.publicId) {
                await deleteFromCloudinary(image.publicId);
            }
        } catch (error) {
            console.error(
                "Failed to delete Cloudinary image:",
                image?.publicId,
                error
            );
        }
    }
};

export const cleanupFiles = (temporaryFiles) => {
    if (!Array.isArray(temporaryFiles)) {
        console.warn("cleanupFiles expected an array");
        return;
    }

    for (const file of temporaryFiles) {
        try {
            if (file && fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (error) {
            console.error("Failed to delete temporary file:", file, error);
        }
    }
};
