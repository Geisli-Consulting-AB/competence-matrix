import React from 'react';
import { ToggleButtonGroup, ToggleButton, CircularProgress, Tooltip } from '@mui/material';

export interface TranslationButtonProps {
  onTranslate: (lang: 'en' | 'sv') => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const TranslationButton: React.FC<TranslationButtonProps> = ({
  onTranslate,
  isLoading = false,
  disabled = false,
}) => {
  const handleChange = (_: React.MouseEvent<HTMLElement>, value: 'en' | 'sv' | null) => {
    if (!value || disabled || isLoading) return;
    onTranslate(value);
  };

  return (
    <Tooltip title={isLoading ? 'Translating...' : 'Translate text'}>
      <span>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={null} // No default selection
          onChange={handleChange}
          disabled={disabled || isLoading}
          aria-label="Translation language toggle"
          sx={{
            '& .MuiToggleButton-root': {
              px: 1,
              textTransform: 'none',
              minWidth: 40,
            },
          }}
        >
          <ToggleButton
            value="en"
            aria-label="Translate to English"
            disabled={disabled || isLoading}
          >
            {isLoading ? <CircularProgress size={14} /> : 'EN'}
          </ToggleButton>
          <ToggleButton
            value="sv"
            aria-label="Translate to Swedish"
            disabled={disabled || isLoading}
          >
            {isLoading ? <CircularProgress size={14} /> : 'SV'}
          </ToggleButton>
        </ToggleButtonGroup>
      </span>
    </Tooltip>
  );
};

export default TranslationButton;

