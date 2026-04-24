const asyncHandler = (fn)=>async(req,res,next)=>{
    try {
        return await fn(req,res,next)
    } catch (error) {
        console.log(error.message|| error)
        throw error
    }
}

export { asyncHandler };
