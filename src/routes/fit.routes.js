import { Router } from "express";
import { JWTVerify,verifyUser } from "../middleware/auth.middleware.js";
import {predictFootwearFit,predictLowerFit,predictOuterwearFit,predictUpperFit} from '../controllers/fit.controller.js'

const router = Router();


router.post("/upper", JWTVerify,verifyUser,predictUpperFit);
router.post("/outerwear",JWTVerify,verifyUser,predictOuterwearFit);
router.post("/lower",JWTVerify,verifyUser,predictLowerFit);
router.post("/footwear",JWTVerify,verifyUser,predictFootwearFit);

export default router;
