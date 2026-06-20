import Router from 'express'
import {createFashnApiModel,pollFashnApiModel} from '../controllers/aiModel.controller.js'
import {JWTVerify,verifySeller} from '../middleware/auth.middleware.js'
import {upload} from '../middleware/multer.middleware.js'

const aiModelRouter = Router()

aiModelRouter.route("/create").post(JWTVerify,verifySeller,upload.single("image"),createFashnApiModel)
aiModelRouter.route("/status/:serviceId").patch(JWTVerify,verifySeller,pollFashnApiModel)

export default aiModelRouter