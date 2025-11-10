import { app } from "../firebase";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

// Initialize Firebase AI Logic
let modelInstance: ReturnType<typeof getGenerativeModel> | null = null;

// Lazy initialization of AI Logic
const getModel = () => {
  if (!modelInstance) {
    // Initialize the Gemini Developer API backend service
    const ai = getAI(app, { backend: new GoogleAIBackend() });

    // Create a `GenerativeModel` instance
    modelInstance = getGenerativeModel(ai, {
      model: "gemini-2.5-flash",
    });
  }
  return modelInstance;
};

/**
 * Translates text from one language to another using Firebase AI Logic (Gemini)
 * @param text - The text to translate
 * @param targetLanguage - Target language ('en' for English, 'sv' for Swedish)
 * @returns Promise<string> - The translated text
 */
export async function translateText(
  text: string,
  targetLanguage: "en" | "sv"
): Promise<string> {
  // Return empty string if input is empty
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    const model = getModel();

    // Determine source and target languages
    const sourceLang = targetLanguage === "en" ? "Swedish" : "English";
    const targetLang = targetLanguage === "en" ? "English" : "Swedish";

    // Create translation prompt
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translation, no explanations or additional text: ${text}`;

    // Call Firebase AI Logic
    const result = await model.generateContent(prompt);
    const response = result.response;
    const translatedText = response.text()?.trim() || text;

    // If translation failed or returned the same text, return original
    if (!translatedText || translatedText === text) {
      return text;
    }

    return translatedText;
  } catch (error) {
    console.error("Translation error:", error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (
        error.message.includes("API key") ||
        error.message.includes("permission") ||
        error.message.includes("not enabled")
      ) {
        throw new Error(
          "Translation service is not configured. Please enable Firebase AI Logic in your Firebase Console."
        );
      }
      if (
        error.message.includes("quota") ||
        error.message.includes("rate limit")
      ) {
        throw new Error(
          "Translation service is temporarily unavailable. Please try again later."
        );
      }
      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      if (
        error.message.includes("Blaze") ||
        error.message.includes("billing")
      ) {
        throw new Error(
          "Firebase AI Logic requires a Blaze (pay-as-you-go) plan. Please upgrade your Firebase plan."
        );
      }
    }

    throw new Error("Translation failed. Please try again.");
  }
}
