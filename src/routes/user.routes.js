import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updatePassword } from "../controllers/user.controller.js";
import {JWTVerify} from "../middleware/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register-user").post(registerUser);
userRouter.route("/login-user").post(loginUser);
userRouter.route("/logout-user").post(JWTVerify, logoutUser);
userRouter.route("/refresh-access-token").post(refreshAccessToken);
userRouter.route("/update-password").patch(JWTVerify, updatePassword);
userRouter.route("/get-current-user").get(JWTVerify, getCurrentUser);
export default userRouter;