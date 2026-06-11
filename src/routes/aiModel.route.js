import Router from 'express'
import {createModel} from '../controllers/aiModel.controller.js'
import {JWTVerify,verifySeller} from '../middleware/auth.middleware.js'
import {upload} from '../middleware/multer.middleware.js'

const aiModelRouter = Router()

aiModelRouter.route("/create").post(JWTVerify,verifySeller,upload.single("image"),createModel)

export default aiModelRouter