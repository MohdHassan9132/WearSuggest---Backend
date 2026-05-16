import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
    sellerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
        required: true,
        index: true
    },
    productId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    type:{
        type: String,
        enum:["single","carousel"],
        required: true
    },
    caption:{
        type: String,
        required: true
    },
    instagramContainerId:{
        type: String,
    },
    instagramMediaId:{
        type: String
    },
    status:{
        type: String,
        enum:["processing","failed","published"],
        default: "processing",
        index: true
    },
    errorMessage:{
        type: String
    },
    publishedAt:{
        type: Date
    }
},{
    timestamps: true
})

export const Post = mongoose.model("Post",postSchema)
