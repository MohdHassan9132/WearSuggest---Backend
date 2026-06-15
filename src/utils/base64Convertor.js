import fs from 'fs'
export const convertToBase64 = function(filePath){
    const fileBuffer = fs.readFileSync(filePath)
    const base64 = fileBuffer.toString('base64')
    return `data:image/jpeg;base64,${base64}`
}

export const covertToImage = function(base64,outputPath){
    const base64Data = base64String.replace(
        /^data:image\/\w+;base64,/,
        ''
    );
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
}