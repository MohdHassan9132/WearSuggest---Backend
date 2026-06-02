import mongoose from "mongoose";

const aiModelSchema = new mongoose.Schema({
    sellerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
        required: true
    },
    isPublic:{
        type: Boolean,
        default: false
    },
    modelMedia:[
        {
            url: String,
            publicId: String
        }
    ]
},{
    timestamps: true
})

aiModelSchema.index({sellerId: 1})

export const AIModel = mongoose.model("AIModel",aiModelSchema)