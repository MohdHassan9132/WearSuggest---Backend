import { ApiError } from "../utils/ApiError.js";
import { stringValidator } from "./string.validator.js";

const bannedWords = [
    "sex",
    "porn",
    "nude",
    "nudity",
    "naked",
    "xxx",
    "erotic",
    "adult",
    "nsfw",
    "boobs",
    "breasts",
    "penis",
    "vagina",
    "sexual"
];

export const validatePrompt = (prompt) => {
    const cleanedPrompt = stringValidator(prompt);

    // Minimum character count
    if (cleanedPrompt.length < 50) {
        throw new ApiError(
            400,
            "Prompt must contain at least 50 characters"
        );
    }

    // Minimum word count
    const wordCount = cleanedPrompt.split(/\s+/).length;

    if (wordCount < 8) {
        throw new ApiError(
            400,
            "Prompt must contain at least 8 words"
        );
    }

    // NSFW check
    const words = cleanedPrompt
        .toLowerCase()
        .split(/\W+/);

    const matchedWord = bannedWords.find(
        word => words.includes(word)
    );

    if (matchedWord) {
        throw new ApiError(
            400,
            `Prompt contains prohibited content: ${matchedWord}`
        );
    }

    return cleanedPrompt;
};