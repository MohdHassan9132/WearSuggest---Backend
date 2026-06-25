import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";

class UserRepository{
    async findUserById(id){
        const user = await User.findById(id)
        if(!user){
            throw new ApiError(404,"User not found")
        }
        return user;
    }
}

export const userRepository = new UserRepository()