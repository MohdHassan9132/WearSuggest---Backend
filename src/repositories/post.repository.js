import { Post } from "../models/post.model.js";

const createPost = async (payload) => Post.create(payload);

const findPostById = async (postId) => Post.findById(postId);

const findPostByIdForSeller = async ({ postId, sellerId }) =>
    Post.findOne({ _id: postId, sellerId });

const updatePostById = async (postId, updates) =>
    Post.findByIdAndUpdate(postId, updates, {
        new: true,
        runValidators: true,
    });

const findProcessingPosts = async () =>
    Post.find({ status: "processing" }).sort({ createdAt: 1 });

export {
    createPost,
    findPostById,
    findPostByIdForSeller,
    findProcessingPosts,
    updatePostById,
};
