import { asyncHandler } from '../utils/AsyncHandler.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {fashnApiService} from '../services/FashnApi/fashnApi.service.js'
import {convertToBase64} from '../utils/base64Convertor.js'
import { ApiError } from '../utils/ApiError.js'
import fs from 'fs'

const createModel = asyncHandler(async(req,res)=>{
    const {prompt,aspectRatio,noOfImages} = req.body
    console.log("from controller",noOfImages)
    if(!req?.file){
        throw new ApiError(400,"Face Reference image is required for model generation")
    }
    try {
        const image = convertToBase64(req.file.path)
        const sellerId = req.user._id
        const aiModel = await fashnApiService.createModel({
            aspectRatio,
            prompt,
            noOfImages,
            image,
            sellerId
        })
        console.log("from controller",aiModel)
        return res.status(201).json(new ApiResponse(201,aiModel,"aiModel Job Initiated"))
    }finally{
        fs.unlinkSync(req.file.path)
    }
})

const pollModel = asyncHandler(async(req,res)=>{
    
    const {serviceId} = req.params
    if(!serviceId){
        throw new ApiError(400,"serviceId is required")
    }
    const modelStatus = await fashnApiService.pollingModel(serviceId,req.user._id)
    if(modelStatus.status !== "completed"){
        return res.status(200).json(new ApiResponse(200,null,modelStatus.status))
    }
    if(modelStatus.status === "completed"){
        return res.status(200).json(new ApiResponse(200,modelStatus,"Model generated successfully"))
    }
    // NOTE:
    // Current return shapes are intentionally simple for V1.
    // If multiple consumers are added later (WebSockets,
    // notifications, emails, queue workers, etc.), consider
    // normalizing the response contract into a consistent shape:
    //
    // {
    //    status,
    //    model,
    //    error
    // }
    //
    // This would make it easier to share the same payload across
    // controllers, sockets, and background services.
})

export {createModel,pollModel}