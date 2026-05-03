import axios from "axios";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { VirtualTryOn } from "../models/virtualTryOn.model.js";
import { Outfit } from "../models/outfit.model.js";
import { generateKlingToken } from "../scripts/kling.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { buildTryOnPayload } from "../utils/tryOnImageBuilder.js";

const createTryOn = asyncHandler(async (req, res) => {
    // const { outfitId } = req.body;

    // if (!outfitId) {
    //     throw new ApiError(400, "OutfitId is required");
    // }

    // const outfit = await Outfit.findById(outfitId)
    //     .populate("top")
    //     .populate("bottom");

    // if (!outfit) {
    //     throw new ApiError(404, "Outfit not found");
    // }

    // if (!req.file) {
    //     throw new ApiError(400, "User image is required");
    // }

    // // 🔥 BUILD PAYLOAD
    // const { human_image, cloth_image } = await buildTryOnPayload({
    //     userImagePath: req.file.path,
    //     topUrl: outfit.top.imageURL,
    //     bottomUrl: outfit.bottom.imageURL,
    // });

    // const token = generateKlingToken();
    // const externalTaskId = `tryon_${Date.now()}`;

    // let response;

    // try {
    //     response = await axios.post(
    //         "https://api-singapore.klingai.com/v1/images/kolors-virtual-try-on",
    //         {
    //             model_name: "kolors-virtual-try-on-v1-5",
    //             human_image,
    //             cloth_image,
    //             external_task_id: externalTaskId,
    //         },
    //         {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 "Content-Type": "application/json",
    //             },
    //         }
    //     );
    // } catch (error) {
    //     console.log(error.data);
    //     throw new ApiError(503, "Service Unavilable");
    // }
    // const task = await VirtualTryOn.create({
    //     owner: req.user._id,
    //     humanImage: "base64",
    //     clothImage: "base64",
    //     taskId: response.data.data.task_id,
    //     externalTaskId,
    //     status: response.data.data.task_status,
    // });

    // return res.json(new ApiResponse(200, task, "Task created"));
});




const getTryOnStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const task = await VirtualTryOn.findById(id);

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const token = generateKlingToken();

    const response = await axios.get(
        `https://api-singapore.klingai.com/v1/images/kolors-virtual-try-on/${task.taskId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    const data = response.data.data;

    task.status = data.task_status;

    // ✅ success → store image
    if (data.task_status === "succeed" && data.task_result?.images?.length) {
        const imageUrl = data.task_result.images[0].url;

        // upload to cloudinary (permanent storage)
        const uploaded = await uploadOnCloudinary(imageUrl);

        task.resultImage = uploaded.secure_url;
    }

    // ❌ failed
    if (data.task_status === "failed") {
        task.errorMessage = data.task_status_msg;
    }

    await task.save();

    return res.status(200).json(new ApiResponse(200, task, "Status updated"));
});

const getUserTryOns = asyncHandler(async (req, res) => {
    const tasks = await VirtualTryOn.find({
        owner: req.user._id,
    }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Fetched successfully"));
});

const createTryOnV21 = asyncHandler(async (req, res) => {
    // const { outfitId } = req.body;

    // if (!outfitId) {
    //     throw new ApiError(400, "OutfitId is required");
    // }

    // const outfit = await Outfit.findById(outfitId)
    //     .populate("top")
    //     .populate("bottom");

    // if (!outfit) {
    //     throw new ApiError(404, "Outfit not found");
    // }

    // if (!req.file) {
    //     throw new ApiError(400, "User image is required");
    // }

    // // 🔹 convert user image → base64
    // const fs = await import("fs");
    // const userBuffer = fs.readFileSync(req.file.path);
    // const human_image = userBuffer.toString("base64");

    // // 🔹 fetch clothing images → base64
    // const axiosResTop = await axios.get(outfit.top.imageURL, {
    //     responseType: "arraybuffer",
    // });

    // const axiosResBottom = await axios.get(outfit.bottom.imageURL, {
    //     responseType: "arraybuffer",
    // });

    // const topBase64 = Buffer.from(axiosResTop.data).toString("base64");
    // const bottomBase64 = Buffer.from(axiosResBottom.data).toString("base64");

    // const token = generateKlingToken();
    // const externalTaskId = `tryon_v21_${Date.now()}`;

    // let response;

    // try {
    //     response = await axios.post(
    //         "https://api-singapore.klingai.com/v1/images/multi-image2image",
    //         {
    //             model_name: "kling-v2-1",

    //             prompt: "A realistic high-quality photo of the person wearing the given outfit. The clothes should fit naturally on the body with proper alignment, realistic folds, correct proportions, and natural lighting. Photorealistic.",

    //             subject_image_list: [
    //                 { subject_image: human_image }, // person
    //                 { subject_image: topBase64 }, // top
    //                 { subject_image: bottomBase64 }, // bottom
    //             ],

    //             aspect_ratio: "1:1",
    //         },
    //         {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 "Content-Type": "application/json",
    //             },
    //         }
    //     );
    // } catch (error) {
    //     console.log("❌ V2.1 Error:", error.response?.data || error.message);
    //     throw new ApiError(503, "V2.1 generation failed");
    // }

    // const task = await VirtualTryOn.create({
    //     owner: req.user._id,
    //     humanImage: "base64",
    //     clothImage: "multi-image",
    //     taskId: response.data.data.task_id,
    //     externalTaskId,
    //     status: response.data.data.task_status,
    //     model: "v2.1",
    // });

    // return res.json(new ApiResponse(200, task, "V2.1 try-on task created"));
});

const getTryOnStatusV21 = asyncHandler(async (req, res) => {
    // const { id } = req.params;

    // const task = await VirtualTryOn.findById(id);

    // if (!task) {
    //     throw new ApiError(404, "Task not found");
    // }

    // const token = generateKlingToken();

    // let response;

    // try {
    //     response = await axios.get(
    //         `https://api-singapore.klingai.com/v1/images/multi-image2image/${task.taskId}`,
    //         {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 "Content-Type": "application/json",
    //             },
    //         }
    //     );
    // } catch (error) {
    //     console.log(
    //         "❌ V2.1 Status Error:",
    //         error.response?.data || error.message
    //     );
    //     throw new ApiError(503, "V2.1 status fetch failed");
    // }

    // const data = response.data.data;

    // task.status = data.task_status;

    // // ✅ success → store image
    // if (data.task_status === "succeed" && data.task_result?.images?.length) {
    //     const imageUrl = data.task_result.images[0].url;

    //     const uploaded = await uploadOnCloudinary(imageUrl);
    //     task.resultImage = uploaded.secure_url;
    // }

    // // ❌ failed
    // if (data.task_status === "failed") {
    //     task.errorMessage = data.task_status_msg;
    // }

    // await task.save();

    // return res
    //     .status(200)
    //     .json(new ApiResponse(200, task, "V2.1 Status updated"));
});

export {
    createTryOn,
    getTryOnStatus,
    getUserTryOns,
    createTryOnV21,
    getTryOnStatusV21,
};
