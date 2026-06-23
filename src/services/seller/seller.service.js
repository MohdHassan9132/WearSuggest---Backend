import { validateEmail } from "../../validators/email.validator.js";
import { validatePassword } from "../../validators/password.validator.js";
import { stringValidator } from "../../validators/string.validator";
import { phoneValidator } from "../../validators/contactNumber.validator.js";
import { sellerRepository } from "../../repositories/seller.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../../utils/cloudinary.js";
import { toSafeSeller } from "../../mappers/seller.mapper.js";

class SellerService {
    async registerSeller({
        name = "",
        email,
        password,
        contactNumber = "",
        source = "",
        instagramConnected = false,
        avatarPath = "",
    }) {
        const validatedEmail = validateEmail(email);
        let avatar;
        try {
            const isSeller = await sellerRepository.findSellerByField(
                "email",
                validatedEmail
            );
            if (isSeller) {
                throw new ApiError(409, "User already exists");
            }
            const validatedPassword = validatePassword(password);
            const validatedName = name === "" ? "" : stringValidator(name);
            const validatedContactNumber =
                contactNumber === "" ? "" : phoneValidator(contactNumber);
            const validatedSource =
                source === "" ? "" : stringValidator(source);
            avatar = avatarPath ? await uploadOnCloudinary(avatarPath) : null;
            //remove sensitive fields
            const seller = await sellerRepository.createSeller({
                name: validatedName,
                email: validatedEmail,
                password: validatedPassword,
                contactNumber: validatedContactNumber,
                avatarUrl: avatar?.secure_url || "",
                avatarPublicId: avatar?.public_id || "",
                source: validatedSource,
            });
            const safeSeller = toSafeSeller(seller);
            return safeSeller;
        } catch (error) {
            console.log(error);
            if (avatar) {
                deleteFromCloudinary(avatar.public_id);
            }
            throw error;
        }
    }
    async loginSeller({ email, password }) {
        const validatedEmail = validateEmail(email);
        const validatedPassword = validatePassword(password);
        try {
            //remove the sensitive fields
            const seller = await sellerRepository.findSellerByField(
                "email",
                validatedEmail
            );
            if (!seller) {
                throw new ApiError(400, "Invalid Credentials");
            }
            if (!(await seller.isPasswordCorrect(validatedPassword))) {
                throw new ApiError(400, "Invalid Credentials");
            }
            const { accessToken, refreshToken } =
                await this.generateSellerTokens(seller);
            const safeSeller = toSafeSeller(seller);
            return { seller: safeSeller, accessToken, refreshToken };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async generateSellerTokens(seller) {
        const accessToken = await seller.generateAccessToken();
        const refreshToken = await seller.generateRefreshToken();
        seller.refreshToken = refreshToken;
        await seller.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    }
    async logoutSeller(id) {
        const seller = await sellerRepository.updateSellerById({
            id,
            fields: {
                refreshToken: undefined,
            },
        });
        if(!seller){
            throw new ApiError(404,"Seller not found")
        }
        return true
    }
    async getCurrentSeller(id){
        const seller = await sellerRepository.findSellerByField("_id",id)
        if(!seller){
            throw new ApiError(404,"Seller Not found")
        }
        const safeSeller = toSafeSeller(seller)
        return safeSeller
    }
}

export const sellerService = new SellerService();
