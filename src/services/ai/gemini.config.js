// import dotenv from "dotenv";
// dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
