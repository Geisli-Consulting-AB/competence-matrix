import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProfileTranslation } from "../useProfileTranslation";
import { translateProfile } from "../../services/translationService";
import type { UserProfile } from "../../components/cv/CVManagement";

// Mock the translation service
vi.mock("../../services/translationService", () => ({
  translateProfile: vi.fn(),
}));

describe("useProfileTranslation", () => {
  const mockProfile: UserProfile = {
    displayName: "Johan Andersson",
    title: "Utvecklare",
    description: "Erfaren utvecklare med fokus på frontend",
    roles: ["Developer", "Team Lead"],
    languages: ["Swedish", "English"],
    expertise: ["React", "TypeScript"],
    projects: [],
    experiences: [],
    educations: [],
    coursesCertifications: [],
    engagementsPublications: [],
  };

  const mockTranslatedResult = {
    displayName: "John Anderson",
    title: "Developer",
    description: "Experienced developer focused on frontend",
    roles: ["Developer", "Team Lead"],
    expertise: ["React", "TypeScript"],
    projects: [],
    experiences: [],
    educations: [],
    coursesCertifications: [],
    engagementsPublications: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() => useProfileTranslation());

      expect(result.current.state).toEqual({
        isOpen: false,
        isTranslating: false,
        result: null,
        error: null,
        cvId: null,
        cvName: "",
      });
    });
  });

  describe("startTranslation", () => {
    it("should set loading state and open dialog when called", async () => {
      vi.mocked(translateProfile).mockResolvedValue(mockTranslatedResult);

      const { result } = renderHook(() => useProfileTranslation());

      await act(async () => {
        await result.current.startTranslation("cv-123", "My CV", mockProfile);
      });

      // Check initial loading state was set
      expect(result.current.state.isOpen).toBe(true);
      expect(result.current.state.cvId).toBe("cv-123");
      expect(result.current.state.cvName).toBe("My CV");
    });

    it("should call translateProfile with correct parameters", async () => {
      vi.mocked(translateProfile).mockResolvedValue(mockTranslatedResult);

      const { result } = renderHook(() => useProfileTranslation());

      await act(async () => {
        await result.current.startTranslation("cv-123", "My CV", mockProfile);
      });

      expect(translateProfile).toHaveBeenCalledWith(mockProfile, "en");
      expect(translateProfile).toHaveBeenCalledTimes(1);
    });

    it("should update state with translated result on success", async () => {
      vi.mocked(translateProfile).mockResolvedValue(mockTranslatedResult);

      const { result } = renderHook(() => useProfileTranslation());

      await act(async () => {
        await result.current.startTranslation("cv-123", "My CV", mockProfile);
      });

      await waitFor(() => {
        expect(result.current.state.isTranslating).toBe(false);
        expect(result.current.state.result).toEqual(mockTranslatedResult);
        expect(result.current.state.error).toBe(null);
      });
    });

    it("should handle errors and set error message", async () => {
      const errorMessage = "Translation failed. Please try again.";
      vi.mocked(translateProfile).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProfileTranslation());

      await act(async () => {
        await result.current.startTranslation("cv-123", "My CV", mockProfile);
      });

      await waitFor(() => {
        expect(result.current.state.isTranslating).toBe(false);
        expect(result.current.state.error).toBe(errorMessage);
        expect(result.current.state.result).toBe(null);
      });
    });

    it("should handle non-Error exceptions", async () => {
      const errorString = "String error";
      vi.mocked(translateProfile).mockRejectedValue(errorString);

      const { result } = renderHook(() => useProfileTranslation());

      await act(async () => {
        await result.current.startTranslation("cv-123", "My CV", mockProfile);
      });

      await waitFor(() => {
        expect(result.current.state.isTranslating).toBe(false);
        expect(result.current.state.error).toBe(
          "Translation failed. Please try again."
        );
      });
    });

    it("should store cvId and cvName correctly", async () => {
      vi.mocked(translateProfile).mockResolvedValue(mockTranslatedResult);

      const { result } = renderHook(() => useProfileTranslation());

      await act(async () => {
        await result.current.startTranslation(
          "cv-456",
          "Test CV Name",
          mockProfile
        );
      });

      expect(result.current.state.cvId).toBe("cv-456");
      expect(result.current.state.cvName).toBe("Test CV Name");
    });
  });

  describe("close", () => {
    it("should reset all state to initial values", async () => {
      vi.mocked(translateProfile).mockResolvedValue(mockTranslatedResult);

      const { result } = renderHook(() => useProfileTranslation());

      // First start a translation
      await act(async () => {
        await result.current.startTranslation("cv-123", "My CV", mockProfile);
      });

      await waitFor(() => {
        expect(result.current.state.isOpen).toBe(true);
      });

      // Then close
      act(() => {
        result.current.close();
      });

      expect(result.current.state).toEqual({
        isOpen: false,
        isTranslating: false,
        result: null,
        error: null,
        cvId: null,
        cvName: "",
      });
    });

    it("should close even when translation is in progress", async () => {
      // Create a promise that never resolves to simulate in-progress translation
      vi.mocked(translateProfile).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useProfileTranslation());

      // Start translation (will be in progress)
      act(() => {
        result.current.startTranslation("cv-123", "My CV", mockProfile);
      });

      // Close while in progress
      act(() => {
        result.current.close();
      });

      expect(result.current.state.isOpen).toBe(false);
    });
  });

  describe("setError", () => {
    it("should update error state correctly", () => {
      const { result } = renderHook(() => useProfileTranslation());

      act(() => {
        result.current.setError("Test error message");
      });

      expect(result.current.state.error).toBe("Test error message");
    });

    it("should allow setting error to null to clear", () => {
      const { result } = renderHook(() => useProfileTranslation());

      // Set error first
      act(() => {
        result.current.setError("Test error");
      });

      expect(result.current.state.error).toBe("Test error");

      // Clear error
      act(() => {
        result.current.setError(null);
      });

      expect(result.current.state.error).toBe(null);
    });
  });

  describe("State Transitions", () => {
    it("should handle complete translation flow", async () => {
      vi.mocked(translateProfile).mockResolvedValue(mockTranslatedResult);

      const { result } = renderHook(() => useProfileTranslation());

      // 1. Start translation
      await act(async () => {
        await result.current.startTranslation("cv-123", "My CV", mockProfile);
      });

      // 2. Verify translation completed
      await waitFor(() => {
        expect(result.current.state.isOpen).toBe(true);
        expect(result.current.state.isTranslating).toBe(false);
        expect(result.current.state.result).toEqual(mockTranslatedResult);
      });

      // 3. Close dialog
      act(() => {
        result.current.close();
      });

      // 4. Verify state reset
      expect(result.current.state.isOpen).toBe(false);
      expect(result.current.state.result).toBe(null);
    });

    it("should handle error flow correctly", async () => {
      const errorMessage = "Network error";
      vi.mocked(translateProfile).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProfileTranslation());

      // Start translation that will fail
      await act(async () => {
        await result.current.startTranslation("cv-123", "My CV", mockProfile);
      });

      // Verify error state
      await waitFor(() => {
        expect(result.current.state.isOpen).toBe(true);
        expect(result.current.state.isTranslating).toBe(false);
        expect(result.current.state.error).toBe(errorMessage);
        expect(result.current.state.result).toBe(null);
      });

      // Clear error
      act(() => {
        result.current.setError(null);
      });

      expect(result.current.state.error).toBe(null);
    });
  });
});
