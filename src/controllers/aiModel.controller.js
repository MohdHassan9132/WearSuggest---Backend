import { asyncHandler } from '../utils/AsyncHandler.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {fashnApiService} from '../services/FashnApi/fashnApi.service.js'
import {convertToBase64} from '../utils/base64Convertor.js'
import { ApiError } from '../utils/ApiError.js'

const createModel = asyncHandler(async(req,res)=>{
    const {prompt,aspectRatio,noOfImages} = req.body
    let image;
    if(req?.file){
        image = convertToBase64(req.file.path)
    }
    const sellerId = req.user._id
    const aiModel = await fashnApiService.createModel({
        aspectRatio,
        prompt,
        noOfImages,
        image,
        sellerId
    })
    console.log("from controller",aiModel)
    return res.status(200).json(new ApiResponse(201,aiModel,"aiModel Job Initiated"))
})

export {createModel}