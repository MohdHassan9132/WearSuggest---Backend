import {stringValidator} from '../validators/string.validator'
export const validateEmail = function validateEmail(email){
    const validatedEmail = stringValidator(email).toLowerCase();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(validatedEmail)) {
    throw new ApiError(400, "Invalid email format");
  }
//Libraries like validator or zod are prefered for production 
  return validatedEmail;

}