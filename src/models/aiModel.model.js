import mongoose from "mongoose";

const aiModelSchema = new mongoose.Schema({
    sellerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
        required: true
    },
    serviceId:{
        type: String,
        required: true
    },
    status: {
    type: String,
    enum: [
        "starting",
        "in_queue",
        'processing',
        'completed',
        'failed'
    ],
    default: "starting"
    },
    error: {
        type: Object,
        default: null
    },
    isPublic:{
        type: Boolean,
        default: true
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
aiModelSchema.index({serviceId: 1})

export const AIModel = mongoose.model("AIModel",aiModelSchema)