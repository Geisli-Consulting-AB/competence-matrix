import React, { useState, useCallback, useEffect, useRef } from "react";
import { TextField, Box, Alert, Snackbar } from "@mui/material";
import TranslationButton from "./TranslationButton";
import { translateText } from "../services/translationService";

export interface TranslatableTextFieldProps extends Omit<
  React.ComponentProps<typeof TextField>,
  "onChange" | "value"
> {
  value: string;
  onChange: (value: string) => void;
  onBlurValue?: (value: string) => void;
  skipTranslation?: boolean; // For fields that shouldn't have translation (email, URL, etc.)
  debounceMs?: number; // Debounce delay in milliseconds (default: 300)
}

/**
 * Wrapper component that combines TextField with TranslationButton
 * Handles translation state and updates field value with translated text
 * Uses debouncing to prevent lag when typing
 */
const TranslatableTextField: React.FC<TranslatableTextFieldProps> = ({
  value,
  onChange,
  onBlurValue,
  skipTranslation = false,
  debounceMs = 300,
  onBlur,
  ...textFieldProps
}) => {
  // Local state for immediate visual feedback
  const [localValue, setLocalValue] = useState(value);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPropValueRef = useRef(value);

  // Sync local value when prop value changes externally (e.g., from translation)
  useEffect(() => {
    if (value !== lastPropValueRef.current) {
      // Prop value changed externally, sync local value
      lastPropValueRef.current = value;
      setLocalValue(value);
      // Clear any pending debounce since this is an external update
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    }
  }, [value]);

  // Debounced onChange handler - only triggers on user input
  useEffect(() => {
    // Skip if this is an external update (value changed but localValue was just synced)
    if (localValue === value && value === lastPropValueRef.current) {
      return;
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Only debounce if the local value differs from the prop value
    // This means the user typed something
    if (localValue !== value) {
      debounceTimeoutRef.current = setTimeout(() => {
        lastPropValueRef.current = localValue;
        onChange(localValue);
      }, debounceMs);
    }

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [localValue, value, onChange, debounceMs]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue); // Update immediately for visual feedback
    },
    []
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Clear any pending debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      // Immediately save the current value on blur (bypass debounce)
      if (localValue !== value) {
        lastPropValueRef.current = localValue;
        onChange(localValue);
      }
      // Notify value-based blur handler if provided
      if (onBlurValue) {
        onBlurValue(localValue);
      }

      // Call the original onBlur handler if provided
      if (onBlur) {
        onBlur(e);
      }
    },
    [localValue, value, onChange, onBlur, onBlurValue]
  );

  const handleTranslate = useCallback(
    async (targetLanguage: "en" | "sv") => {
      // Use localValue for translation (current input value)
      const currentValue = localValue || value;

      // Skip translation if field is empty or translation is disabled
      if (
        !currentValue ||
        currentValue.trim().length === 0 ||
        skipTranslation
      ) {
        return;
      }

      setIsTranslating(true);
      setError(null);

      try {
        const translatedText = await translateText(
          currentValue,
          targetLanguage
        );
        // Update local value immediately for visual feedback
        setLocalValue(translatedText);
        // Update the ref to mark this as an external update
        lastPropValueRef.current = translatedText;
        // Call onChange immediately for translation (no debounce needed)
        onChange(translatedText);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Translation failed. Please try again.";
        setError(errorMessage);
        console.error("Translation error:", err);
      } finally {
        setIsTranslating(false);
      }
    },
    [localValue, value, onChange, skipTranslation]
  );

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      <Box sx={{ position: "relative", width: "100%" }}>
        <TextField
          {...textFieldProps}
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          InputProps={{
            ...textFieldProps.InputProps,
            endAdornment: !skipTranslation ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  ml: 1,
                }}
              >
                <TranslationButton
                  onTranslate={handleTranslate}
                  isLoading={isTranslating}
                  disabled={!localValue || localValue.trim().length === 0}
                />
                {textFieldProps.InputProps?.endAdornment}
              </Box>
            ) : (
              textFieldProps.InputProps?.endAdornment
            ),
          }}
        />
      </Box>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TranslatableTextField;
