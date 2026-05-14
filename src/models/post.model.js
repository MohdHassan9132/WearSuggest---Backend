import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
    sellerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
        required: true
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
        enum:["failed","published"]
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
