import { Stack, Tooltip, IconButton, useTheme } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface ScrollControlsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export default function ScrollControls({
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
}: ScrollControlsProps) {
  const theme = useTheme();

  // Always show scroll controls for debugging
  // if (!canScrollLeft && !canScrollRight) {
  //   return null
  // }

  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title={canScrollLeft ? "Scroll left" : ""}>
        <span>
          <IconButton
            onClick={onScrollLeft}
            disabled={!canScrollLeft}
            size="small"
            sx={{
              backgroundColor: theme.palette.grey[800],
              color: theme.palette.common.white,
              "&:hover": {
                backgroundColor: theme.palette.grey[700],
              },
              "&:disabled": {
                backgroundColor: theme.palette.grey[600],
                color: theme.palette.grey[400],
              },
            }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={canScrollRight ? "Scroll right" : ""}>
        <span>
          <IconButton
            onClick={onScrollRight}
            disabled={!canScrollRight}
            size="small"
            sx={{
              backgroundColor: theme.palette.grey[800],
              color: theme.palette.common.white,
              "&:hover": {
                backgroundColor: theme.palette.grey[700],
              },
              "&:disabled": {
                backgroundColor: theme.palette.grey[600],
                color: theme.palette.grey[400],
              },
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
