import { app } from "../firebase";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

let modelInstance: ReturnType<typeof getGenerativeModel> | null = null;

const getModel = () => {
  if (!modelInstance) {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    modelInstance = getGenerativeModel(ai, {
      model: "gemini-2.5-flash",
    });
  }
  return modelInstance;
};

/**
 * Extracts competences mentioned in a job description text using Gemini AI.
 * @param text - The job description text
 * @returns Promise<string[]> - List of extracted competence names
 */
export async function extractCompetences(text: string): Promise<string[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  try {
    const model = getModel();

    const prompt = `Extract the most important technical and soft skills, technologies, and core competences mentioned in the following job description. 

Guidelines:
1. Focus on actual skills and technologies (e.g., "Java", "React", "Project Management").
2. Avoid generic workplace attributes that aren't specific competences (e.g., "ambitious", "human", "great people", "team culture").
3. Do not include redundant or overlapping terms (e.g., if you have "Java", don't also include "Modern Java" unless they represent distinct requirements).
4. Aim for a concise list of 10-20 most relevant items.
5. Return ONLY a JSON array of strings.

Job Description:
${text}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text()?.trim() || "[]";

    // Clean up response text if it contains markdown code blocks
    const cleanedText = responseText.replace(/```json\n?/, "").replace(/```/, "").trim();

    try {
      const extracted = JSON.parse(cleanedText);
      if (Array.isArray(extracted)) {
        return extracted;
      }
      return [];
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", cleanedText, parseError);
      // Fallback: split by lines if JSON parsing fails and it doesn't look like JSON
      if (!cleanedText.startsWith("[")) {
          return cleanedText.split("\n").map(s => s.trim().replace(/^- /, "")).filter(s => s.length > 0);
      }
      return [];
    }
  } catch (error) {
    console.error("Competence extraction error:", error);
    throw error;
  }
}

/**
 * Matches extracted requirements against a list of available competences using Gemini AI.
 * This performs fuzzy matching (e.g., "React.js" matches "React").
 * @param requirements - List of extracted requirements from job description
 * @param availableCompetences - List of all competence names available in the system
 * @returns Promise<Record<string, string[]>> - A map where keys are requirements and values are arrays of matching available competence names
 */
export async function matchCompetencesFuzzy(
  requirements: string[],
  availableCompetences: string[]
): Promise<Record<string, string[]>> {
  if (requirements.length === 0 || availableCompetences.length === 0) {
    return {};
  }

  try {
    const model = getModel();

    const prompt = `You are a technical recruiter. I have a list of job requirements and a list of available competences from our team.
For each job requirement, identify which (if any) of the available competences match it. 
This should be a fuzzy match - for example, "React.js" should match "React", "Node" should match "Node.js", "Java 17" should match "Java".

Return ONLY a JSON object where:
- Keys are the job requirements provided.
- Values are arrays of matching competence names from the available list.
- If no match is found for a requirement, use an empty array [].

Job Requirements:
${JSON.stringify(requirements)}

Available Competences:
${JSON.stringify(availableCompetences)}

Return ONLY the JSON object, no explanation.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text()?.trim() || "{}";

    const cleanedText = responseText.replace(/```json\n?/, "").replace(/```/, "").trim();

    try {
      const matched = JSON.parse(cleanedText);
      return matched;
    } catch (parseError) {
      console.error("Failed to parse AI matching response as JSON:", cleanedText, parseError);
      return {};
    }
  } catch (error) {
    console.error("Fuzzy matching error:", error);
    return {};
  }
}
