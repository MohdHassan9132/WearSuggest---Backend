export const stringValidator = function(string){
    if(typeof string !== "string"){
        throw new ApiError(400,"Data type must be string")
    }
   const trimmedString = string.trim()
   if(!trimmedString){
    throw new ApiError(400,"String cannot be empty")
   }
   return trimmedString;
    
}