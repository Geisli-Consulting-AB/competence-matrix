import { useState, useCallback } from "react";
import {
  translateProfile,
  type TranslatedProfileResult,
} from "../services/translationService";
import type { UserProfile } from "../components/cv/CVManagement";

export interface TranslationState {
  isOpen: boolean;
  isTranslating: boolean;
  result: TranslatedProfileResult | null;
  error: string | null;
  cvId: string | null;
  cvName: string;
}

const initialState: TranslationState = {
  isOpen: false,
  isTranslating: false,
  result: null,
  error: null,
  cvId: null,
  cvName: "",
};

export interface UseProfileTranslationReturn {
  state: TranslationState;
  startTranslation: (
    cvId: string,
    cvName: string,
    profile: UserProfile
  ) => Promise<void>;
  close: () => void;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for managing CV translation state and logic.
 * Consolidates translation dialog state into a single state object.
 */
export function useProfileTranslation(): UseProfileTranslationReturn {
  const [state, setState] = useState<TranslationState>(initialState);

  const startTranslation = useCallback(
    async (cvId: string, cvName: string, profile: UserProfile) => {
      setState({
        isOpen: true,
        isTranslating: true,
        result: null,
        error: null,
        cvId,
        cvName,
      });

      try {
        const translated = await translateProfile(profile, "en");
        setState((prev) => ({
          ...prev,
          isTranslating: false,
          result: translated,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Translation failed. Please try again.";
        setState((prev) => ({
          ...prev,
          isTranslating: false,
          error: errorMessage,
        }));
      }
    },
    []
  );

  const close = useCallback(() => {
    setState(initialState);
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  return { state, startTranslation, close, setError };
}
