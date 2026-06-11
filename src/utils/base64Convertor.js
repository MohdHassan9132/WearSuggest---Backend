import fs from 'fs'
export const convertToBase64 = function(filePath){
    const fileBuffer = fs.readFileSync(filePath)
    const base64 = fileBuffer.toString('base64')
    return `data:image/jpeg;base64,${base64}`
}