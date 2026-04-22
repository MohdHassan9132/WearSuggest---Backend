import { Router } from "express";
import { loginUser, registerUser,logoutUser,refreshAccessToken,updatePassword,getCurrentUser } from "../controllers/user.controller.js";
import {JWTVerify, verifyUser} from '../middleware/auth.middleware.js'

const userRouter = Router();

userRouter.route("/register-user").post(registerUser);
userRouter.route("/login-user").post(loginUser);
userRouter.route("/logout-user").post(JWTVerify, verifyUser, logoutUser);
userRouter.route("/refresh-access-token").post(refreshAccessToken);
userRouter.route("/update-password").patch(JWTVerify, verifyUser, updatePassword);
userRouter.route("/get-current-user").get(JWTVerify, verifyUser, getCurrentUser);

export default userRouter;
