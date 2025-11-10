import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { translateText } from "../translationService";

// Mock Firebase AI Logic
const mockGenerateContent = vi.fn();
const mockResponse = {
  text: vi.fn(),
};
const mockModel = {
  generateContent: mockGenerateContent,
};

vi.mock("firebase/ai", () => ({
  getAI: vi.fn(),
  getGenerativeModel: vi.fn(() => mockModel),
  GoogleAIBackend: vi.fn(),
}));

vi.mock("../firebase", () => ({
  app: {},
}));

describe("translationService", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup default mock response
    mockResponse.text.mockReturnValue("");
    mockGenerateContent.mockResolvedValue({
      response: mockResponse,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("translateText", () => {
    it("should return empty string for empty input", async () => {
      const result = await translateText("", "en");
      expect(result).toBe("");
    });

    it("should return empty string for whitespace-only input", async () => {
      const result = await translateText("   ", "en");
      expect(result).toBe("   ");
    });

    it("should translate text from Swedish to English", async () => {
      const inputText = "Hej världen";
      const translatedText = "Hello world";

      mockResponse.text.mockReturnValue(translatedText);

      const result = await translateText(inputText, "en");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(
          "Translate the following text from Swedish to English"
        )
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(inputText)
      );
      expect(result).toBe(translatedText);
    });

    it("should translate text from English to Swedish", async () => {
      const inputText = "Hello world";
      const translatedText = "Hej världen";

      mockResponse.text.mockReturnValue(translatedText);

      const result = await translateText(inputText, "sv");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(
          "Translate the following text from English to Swedish"
        )
      );
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining(inputText)
      );
      expect(result).toBe(translatedText);
    });

    it("should trim translated text", async () => {
      const inputText = "Hello";
      const translatedText = "  Hej  ";

      mockResponse.text.mockReturnValue(translatedText);

      const result = await translateText(inputText, "sv");

      expect(result).toBe("Hej");
    });

    it("should return original text if translation returns empty string", async () => {
      const inputText = "Hello world";
      mockResponse.text.mockReturnValue("");

      const result = await translateText(inputText, "sv");

      expect(result).toBe(inputText);
    });

    it("should return original text if translation returns the same text", async () => {
      const inputText = "Hello world";
      mockResponse.text.mockReturnValue(inputText);

      const result = await translateText(inputText, "sv");

      expect(result).toBe(inputText);
    });

    it("should handle API key/permission errors", async () => {
      const inputText = "Hello";
      const error = new Error("API key not found or permission denied");

      mockGenerateContent.mockRejectedValue(error);

      await expect(translateText(inputText, "sv")).rejects.toThrow(
        "Translation service is not configured. Please enable Firebase AI Logic in your Firebase Console."
      );
    });

    it("should handle quota/rate limit errors", async () => {
      const inputText = "Hello";
      const error = new Error("Quota exceeded or rate limit reached");

      mockGenerateContent.mockRejectedValue(error);

      await expect(translateText(inputText, "sv")).rejects.toThrow(
        "Translation service is temporarily unavailable. Please try again later."
      );
    });

    it("should handle network errors", async () => {
      const inputText = "Hello";
      const error = new Error("Network error or fetch failed");

      mockGenerateContent.mockRejectedValue(error);

      await expect(translateText(inputText, "sv")).rejects.toThrow(
        "Network error. Please check your connection and try again."
      );
    });

    it("should handle billing/Blaze plan errors", async () => {
      const inputText = "Hello";
      const error = new Error("Blaze plan required or billing issue");

      mockGenerateContent.mockRejectedValue(error);

      await expect(translateText(inputText, "sv")).rejects.toThrow(
        "Firebase AI Logic requires a Blaze (pay-as-you-go) plan. Please upgrade your Firebase plan."
      );
    });

    it("should handle generic errors", async () => {
      const inputText = "Hello";
      const error = new Error("Unknown error occurred");

      mockGenerateContent.mockRejectedValue(error);

      await expect(translateText(inputText, "sv")).rejects.toThrow(
        "Translation failed. Please try again."
      );
    });

    it("should handle non-Error exceptions", async () => {
      const inputText = "Hello";
      const error = "String error";

      mockGenerateContent.mockRejectedValue(error);

      await expect(translateText(inputText, "sv")).rejects.toThrow(
        "Translation failed. Please try again."
      );
    });

    it("should handle undefined response text", async () => {
      const inputText = "Hello";
      mockResponse.text.mockReturnValue(undefined);

      const result = await translateText(inputText, "sv");

      expect(result).toBe(inputText);
    });
  });
});
