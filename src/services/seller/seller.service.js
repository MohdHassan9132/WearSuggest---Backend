import { validateEmail } from "../../validators/email.validator.js";
import {validatePassword} from '../../validators/password.validator.js'
import { stringValidator } from "../../validators/string.validator";
import { phoneValidator } from "../../validators/contactNumber.validator.js";
import { sellerRepository } from '../../repositories/seller.repository.js'
import { ApiError } from "../../utils/ApiError.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../../utils/cloudinary.js";

class SellerService{
    async registerSeller({
        name = "",
        email,
        password,
        contactNumber = "",
        source = "",
        instagramConnected = false,
        avatarPath = ""
    }){
        const validatedEmail = validateEmail(email)
        let avatar;
        try {
            const isSeller = await sellerRepository.findSellerByField("email",validatedEmail)
            if(isSeller){
                throw new ApiError(409,"User already exists")
            }
            const validatedPassword = validatePassword(password)
            const validatedName = name === ""?"":stringValidator(name)
            const validatedContactNumber = contactNumber === ""?"":phoneValidator(contactNumber)
            const validatedSource = source === ""?"":stringValidator(source)
            avatar = avatarPath?await uploadOnCloudinary(avatarPath): null
            
            const seller = await sellerRepository.createSeller({
                name: validatedName,
                email: validatedEmail,
                password: validatedPassword,
                contactNumber: validatedContactNumber,
                avatarUrl: avatar?.secure_url || "",
                avatarPublicId: avatar?.public_id || "",
                source: validatedSource
            })
            return seller
        } catch (error) {
            console.log(error)
            if(avatar){
                deleteFromCloudinary(avatar.public_id)
            }
            throw error
        }

    }
}

export const sellerService = new SellerService()