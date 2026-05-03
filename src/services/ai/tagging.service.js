import { genAI } from "./gemini.config.js";
import { COLOR_GROUP_MAP } from "../../constants/colors.js";

export const generateClothingMetadata = async (imageBuffer, mimeType) => {
  const validColors = Object.keys(COLOR_GROUP_MAP);
  
  // Use the genAI instance to get the model
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    // System instruction helps Gemini follow your DB rules
    systemInstruction: `You are a professional fashion cataloger. 
    Select the closest matching color from this list: [${validColors.join(", ")}].
    Return data in strict JSON format.`
  });

  const generationConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        category: { type: "string" },
        type: { type: "string", enum: ["top", "bottom", "footwear", "outerwear", "accessory"] },
        color: { type: "string", enum: validColors },
        season: { type: "array", items: { type: "string", enum: ["summer", "winter", "rainy"] } },
        occasion: { type: "string", enum: ["casual", "formal", "party"] }
      },
      required: ["category", "type", "color", "season", "occasion"]
    }
  };

  const result = await model.generateContent({
    contents: [{
      role: "user",
      parts: [
        { text: "Identify this item for my digital wardrobe." },
        { inlineData: { data: imageBuffer.toString("base64"), mimeType } }
      ]
    }],
    generationConfig
  });

  return JSON.parse(result.response.text());
};
