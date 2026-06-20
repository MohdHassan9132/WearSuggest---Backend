import { Seller } from "../models/seller.model.js";

class SellerRepository{
// Computed Property Name (ES6).
// Allows dynamic object property names.
// Before ES6 we typically created the object first and then assigned:
// obj[field] = value
// Here [field] is evaluated and its value becomes the property name.
    async findSellerByField(field,fieldValue){
        return await Seller.exists({
            [field]: fieldValue,
        })
    }
    async createSeller({
        name,
        email,
        password,
        contactNumber,
        source,
        avatarUrl,
        avatarPublicId,
    }){
        const seller = await Seller.create({
            name,
            email,
            password,
            contactNumber,
            source,
            avatarUrl,
            avatarPublicId
        })
        const safeSeller = seller.toObject()
        delete safeSeller.avatarPublicId
        delete safeSeller.refreshToken
        delete safeSeller.password
        delete safeSeller.igAccessToken
        delete safeSeller.igTokenExpiresAt
        return safeSeller
    }
}

export const sellerRepository = new SellerRepository()
