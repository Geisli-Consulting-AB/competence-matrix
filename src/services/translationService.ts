import { app } from "../firebase";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import type {
  UserProfile,
  Experience,
  Education,
  CourseCert,
  EngagementPublication,
  Project,
} from "../components/cv/CVManagement";

// Initialize Firebase AI Logic
let modelInstance: ReturnType<typeof getGenerativeModel> | null = null;

/**
 * Result of batch profile translation
 */
export interface TranslatedProfileResult {
  displayName?: string;
  title?: string;
  description?: string;
  roles?: string[];
  expertise?: string[];
  projects?: Project[];
  experiences?: Experience[];
  educations?: Education[];
  coursesCertifications?: CourseCert[];
  engagementsPublications?: EngagementPublication[];
}

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

/**
 * Translates a single text field, returning empty string if input is empty
 */
async function translateField(
  text: string | undefined,
  targetLanguage: "en" | "sv"
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text || "";
  }
  return translateText(text, targetLanguage);
}

/**
 * Translates an array of strings
 */
async function translateStringArray(
  arr: string[] | undefined,
  targetLanguage: "en" | "sv"
): Promise<string[]> {
  if (!arr || arr.length === 0) return [];

  // Translate all strings in parallel for efficiency
  const results = await Promise.all(
    arr.map((item) => translateField(item, targetLanguage))
  );
  return results;
}

/**
 * Batch translates all translatable fields in a user profile
 * @param profile - The user profile to translate
 * @param targetLanguage - Target language ('en' for English, 'sv' for Swedish)
 * @returns Promise<TranslatedProfileResult> - The translated profile data
 */
export async function translateProfile(
  profile: UserProfile,
  targetLanguage: "en" | "sv"
): Promise<TranslatedProfileResult> {
  try {
    // Translate basic fields in parallel
    const [displayName, title, description, roles, expertise] =
      await Promise.all([
        translateField(profile.displayName, targetLanguage),
        translateField(profile.title, targetLanguage),
        translateField(profile.description, targetLanguage),
        translateStringArray(profile.roles, targetLanguage),
        translateStringArray(profile.expertise, targetLanguage),
      ]);

    // Translate experiences
    const experiences: Experience[] = await Promise.all(
      (profile.experiences || []).map(async (exp) => {
        const [employer, expTitle, expDescription] = await Promise.all([
          translateField(exp.employer, targetLanguage),
          translateField(exp.title, targetLanguage),
          translateField(exp.description, targetLanguage),
        ]);
        return {
          ...exp,
          employer,
          title: expTitle,
          description: expDescription,
        };
      })
    );

    // Translate educations
    const educations: Education[] = await Promise.all(
      (profile.educations || []).map(async (edu) => {
        const [school, eduTitle] = await Promise.all([
          translateField(edu.school, targetLanguage),
          translateField(edu.title, targetLanguage),
        ]);
        return {
          ...edu,
          school,
          title: eduTitle,
        };
      })
    );

    // Translate courses & certifications
    const coursesCertifications: CourseCert[] = await Promise.all(
      (profile.coursesCertifications || []).map(async (course) => {
        const [courseTitle, organization] = await Promise.all([
          translateField(course.title, targetLanguage),
          translateField(course.organization, targetLanguage),
        ]);
        return {
          ...course,
          title: courseTitle,
          organization,
        };
      })
    );

    // Translate engagements & publications
    const engagementsPublications: EngagementPublication[] = await Promise.all(
      (profile.engagementsPublications || []).map(async (eng) => {
        const [engTitle, locationOrPublication, engDescription] =
          await Promise.all([
            translateField(eng.title, targetLanguage),
            translateField(eng.locationOrPublication, targetLanguage),
            translateField(eng.description, targetLanguage),
          ]);
        return {
          ...eng,
          title: engTitle,
          locationOrPublication,
          description: engDescription,
        };
      })
    );

    // Translate projects
    const projects: Project[] = await Promise.all(
      (profile.projects || []).map(async (project) => {
        const [customer, projectTitle, projectDescription] = await Promise.all([
          translateField(project.customer, targetLanguage),
          translateField(project.title, targetLanguage),
          translateField(project.description, targetLanguage),
        ]);
        return {
          ...project,
          customer,
          title: projectTitle,
          description: projectDescription,
        };
      })
    );

    return {
      displayName,
      title,
      description,
      roles,
      expertise,
      experiences,
      educations,
      coursesCertifications,
      engagementsPublications,
      projects,
    };
  } catch (error) {
    console.error("Batch translation error:", error);

    // Re-throw with a user-friendly message
    if (error instanceof Error) {
      throw error; // Keep the original error message if it's already user-friendly
    }
    throw new Error("Failed to translate profile. Please try again.");
  }
}
