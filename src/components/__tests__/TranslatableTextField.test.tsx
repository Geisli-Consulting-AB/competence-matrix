import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import TranslatableTextField from "../TranslatableTextField";
import { translateText } from "../../services/translationService";

interface MockTranslationButtonProps {
  onTranslate: (language: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const setupUserEvent = (withFakeTimers = false) =>
  withFakeTimers
    ? userEvent.setup({
        delay: null,
        advanceTimers: vi.advanceTimersByTime,
      })
    : userEvent.setup({ delay: null });

// Mock the translation service
vi.mock("../../services/translationService", () => ({
  translateText: vi.fn(),
}));

// Mock TranslationButton
vi.mock("../TranslationButton", () => ({
  default: ({
    onTranslate,
    isLoading,
    disabled,
  }: MockTranslationButtonProps) => (
    <div data-testid="translation-button">
      <button
        onClick={() => onTranslate("en")}
        disabled={disabled || isLoading}
        data-testid="translate-en"
      >
        {isLoading ? "Loading..." : "EN"}
      </button>
      <button
        onClick={() => onTranslate("sv")}
        disabled={disabled || isLoading}
        data-testid="translate-sv"
      >
        {isLoading ? "Loading..." : "SV"}
      </button>
    </div>
  ),
}));

describe("TranslatableTextField", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Basic functionality", () => {
    it("should render TextField with value", () => {
      render(
        <TranslatableTextField
          value="Test value"
          onChange={mockOnChange}
          label="Test Field"
        />
      );

      const input = screen.getByLabelText("Test Field") as HTMLInputElement;
      expect(input.value).toBe("Test value");
    });

    it("should update local value immediately on input", async () => {
      const user = setupUserEvent();
      render(
        <TranslatableTextField value="" onChange={mockOnChange} label="Test" />
      );

      const input = screen.getByLabelText("Test") as HTMLInputElement;
      await user.type(input, "Hello");

      expect(input.value).toBe("Hello");
    });

    it("should debounce onChange calls", async () => {
      vi.useFakeTimers();

      try {
        render(
          <TranslatableTextField
            value=""
            onChange={mockOnChange}
            label="Test"
            debounceMs={300}
          />
        );

        const input = screen.getByLabelText("Test") as HTMLInputElement;

        // Use fireEvent instead of userEvent for fake timers
        fireEvent.change(input, { target: { value: "Hello" } });

        // onChange should not be called immediately
        expect(mockOnChange).not.toHaveBeenCalled();

        // Fast-forward time
        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Now onChange should be called (no waitFor needed with fake timers)
        expect(mockOnChange).toHaveBeenCalledWith("Hello");
      } finally {
        vi.useRealTimers();
      }
    });

    it("should clear debounce timeout on rapid typing", async () => {
      vi.useFakeTimers();

      try {
        render(
          <TranslatableTextField
            value=""
            onChange={mockOnChange}
            label="Test"
            debounceMs={300}
          />
        );

        const input = screen.getByLabelText("Test") as HTMLInputElement;

        // Use fireEvent instead of userEvent for fake timers
        act(() => {
          fireEvent.change(input, { target: { value: "H" } });
          vi.advanceTimersByTime(200);
        });

        act(() => {
          fireEvent.change(input, { target: { value: "He" } });
          vi.advanceTimersByTime(200);
        });

        act(() => {
          fireEvent.change(input, { target: { value: "Hel" } });
        });

        // Should not have called onChange yet
        expect(mockOnChange).not.toHaveBeenCalled();

        // After full debounce period
        act(() => {
          vi.advanceTimersByTime(300);
        });

        // onChange should be called (no waitFor needed with fake timers)
        expect(mockOnChange).toHaveBeenCalledWith("Hel");
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("Translation functionality", () => {
    it("should show translation button when skipTranslation is false", () => {
      render(
        <TranslatableTextField
          value="Test"
          onChange={mockOnChange}
          label="Test"
        />
      );

      expect(screen.getByTestId("translation-button")).toBeInTheDocument();
    });

    it("should hide translation button when skipTranslation is true", () => {
      render(
        <TranslatableTextField
          value="Test"
          onChange={mockOnChange}
          label="Test"
          skipTranslation
        />
      );

      expect(
        screen.queryByTestId("translation-button")
      ).not.toBeInTheDocument();
    });

    it("should translate text when EN button is clicked", async () => {
      vi.mocked(translateText).mockResolvedValue("Hello world");

      render(
        <TranslatableTextField
          value="Hej världen"
          onChange={mockOnChange}
          label="Test"
        />
      );

      const enButton = screen.getByTestId("translate-en");
      fireEvent.click(enButton);

      await waitFor(() => {
        expect(translateText).toHaveBeenCalledWith("Hej världen", "en");
        expect(mockOnChange).toHaveBeenCalledWith("Hello world");
      });

      const input = screen.getByLabelText("Test") as HTMLInputElement;
      expect(input.value).toBe("Hello world");
    });

    it("should translate text when SV button is clicked", async () => {
      vi.mocked(translateText).mockResolvedValue("Hej världen");

      render(
        <TranslatableTextField
          value="Hello world"
          onChange={mockOnChange}
          label="Test"
        />
      );

      const svButton = screen.getByTestId("translate-sv");
      fireEvent.click(svButton);

      await waitFor(() => {
        expect(translateText).toHaveBeenCalledWith("Hello world", "sv");
        expect(mockOnChange).toHaveBeenCalledWith("Hej världen");
      });

      const input = screen.getByLabelText("Test") as HTMLInputElement;
      expect(input.value).toBe("Hej världen");
    });

    it("should not translate if field is empty", async () => {
      render(
        <TranslatableTextField value="" onChange={mockOnChange} label="Test" />
      );

      const enButton = screen.getByTestId("translate-en");
      expect(enButton).toBeDisabled();

      fireEvent.click(enButton);

      await waitFor(() => {
        expect(translateText).not.toHaveBeenCalled();
      });
    });

    it("should not translate if field contains only whitespace", async () => {
      render(
        <TranslatableTextField
          value="   "
          onChange={mockOnChange}
          label="Test"
        />
      );

      const enButton = screen.getByTestId("translate-en");
      expect(enButton).toBeDisabled();
    });

    it("should show loading state during translation", async () => {
      vi.mocked(translateText).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve("Translated"), 100))
      );

      render(
        <TranslatableTextField
          value="Test"
          onChange={mockOnChange}
          label="Test"
        />
      );

      const enButton = screen.getByTestId("translate-en");
      const svButton = screen.getByTestId("translate-sv");
      fireEvent.click(enButton);

      // Should show loading state
      expect(screen.getAllByText("Loading...")).toHaveLength(2);
      expect(enButton).toBeDisabled();
      expect(svButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryAllByText("Loading...")).toHaveLength(0);
      });
    });

    it("should display error message on translation failure", async () => {
      const errorMessage = "Translation service is not configured";
      vi.mocked(translateText).mockRejectedValue(new Error(errorMessage));

      // Suppress expected console.error from component
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <TranslatableTextField
          value="Test"
          onChange={mockOnChange}
          label="Test"
        />
      );

      const enButton = screen.getByTestId("translate-en");
      fireEvent.click(enButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Verify console.error was called (error handling works)
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should clear error message when Snackbar is closed", async () => {
      const errorMessage = "Translation service is not configured";
      vi.mocked(translateText).mockRejectedValue(new Error(errorMessage));

      // Suppress expected console.error from component
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <TranslatableTextField
          value="Test"
          onChange={mockOnChange}
          label="Test"
        />
      );

      const enButton = screen.getByTestId("translate-en");
      fireEvent.click(enButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Close the snackbar
      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });

      // Verify console.error was called (error handling works)
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should use localValue for translation if available", async () => {
      vi.mocked(translateText).mockResolvedValue("Translated");

      const user = setupUserEvent();
      render(
        <TranslatableTextField
          value="Initial"
          onChange={mockOnChange}
          label="Test"
        />
      );

      const input = screen.getByLabelText("Test") as HTMLInputElement;
      await user.type(input, "New text");

      const enButton = screen.getByTestId("translate-en");
      fireEvent.click(enButton);

      await waitFor(() => {
        expect(translateText).toHaveBeenCalledWith("InitialNew text", "en");
      });
    });
  });

  describe("External value updates", () => {
    it("should sync local value when prop value changes externally", async () => {
      const { rerender } = render(
        <TranslatableTextField
          value="Initial"
          onChange={mockOnChange}
          label="Test"
        />
      );

      const input = screen.getByLabelText("Test") as HTMLInputElement;
      expect(input.value).toBe("Initial");

      // Update prop value
      rerender(
        <TranslatableTextField
          value="Updated"
          onChange={mockOnChange}
          label="Test"
        />
      );

      await waitFor(() => {
        expect(input.value).toBe("Updated");
      });
    });

    it("should clear debounce timeout on external value update", async () => {
      vi.useFakeTimers();

      try {
        const { rerender } = render(
          <TranslatableTextField
            value=""
            onChange={mockOnChange}
            label="Test"
            debounceMs={300}
          />
        );

        const input = screen.getByLabelText("Test") as HTMLInputElement;

        // Use fireEvent instead of userEvent for fake timers
        act(() => {
          fireEvent.change(input, { target: { value: "Typing" } });
        });

        // Update prop value externally (e.g., from translation)
        rerender(
          <TranslatableTextField
            value="Translated"
            onChange={mockOnChange}
            label="Test"
            debounceMs={300}
          />
        );

        // Fast-forward time
        act(() => {
          vi.advanceTimersByTime(300);
        });

        // onChange should not be called with 'Typing' because external update cleared it
        // (no waitFor needed with fake timers)
        expect(mockOnChange).not.toHaveBeenCalledWith("Typing");
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("Custom debounce delay", () => {
    it("should use custom debounce delay", async () => {
      vi.useFakeTimers();

      try {
        render(
          <TranslatableTextField
            value=""
            onChange={mockOnChange}
            label="Test"
            debounceMs={500}
          />
        );

        const input = screen.getByLabelText("Test") as HTMLInputElement;

        // Use fireEvent instead of userEvent for fake timers
        act(() => {
          fireEvent.change(input, { target: { value: "Test" } });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });
        expect(mockOnChange).not.toHaveBeenCalled();

        act(() => {
          vi.advanceTimersByTime(200);
        });
        // onChange should be called (no waitFor needed with fake timers)
        expect(mockOnChange).toHaveBeenCalledWith("Test");
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("TextField props forwarding", () => {
    it("should forward TextField props", () => {
      render(
        <TranslatableTextField
          value="Test"
          onChange={mockOnChange}
          label="Test"
          placeholder="Enter text"
          multiline
          rows={4}
        />
      );

      const input = screen.getByLabelText("Test") as HTMLTextAreaElement;
      expect(input.placeholder).toBe("Enter text");
      expect(input.getAttribute("rows")).toBe("4");
    });
  });
});
