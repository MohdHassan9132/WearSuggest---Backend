import { Seller } from "../models/seller.model.js";

class SellerRepository{
// Computed Property Name (ES6).
// Allows dynamic object property names.
// Before ES6 we typically created the object first and then assigned:
// obj[field] = value
// Here [field] is evaluated and its value becomes the property name.
    async findSellerByField(field,fieldValue){
        return await Seller.findOne({
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
        return await Seller.create({
            name,
            email,
            password,
            contactNumber,
            source,
            avatarUrl,
            avatarPublicId
        })
    }
    async updateSellerById({
        id,
        fields,
    }){
        const seller = await Seller.findByIdAndUpdate(
            id,
            {
                $set:{
                    ...fields
                }
            },
            {returnDocument: "after"}
        )
        return seller
    }
}

export const sellerRepository = new SellerRepository()
