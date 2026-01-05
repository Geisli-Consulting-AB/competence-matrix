// Shared layout constants for PDF generation
export const LAYOUT = {
  // Column widths
  LEFT_COLUMN: 60, // in mm
  RIGHT_COLUMN: 130, // in mm
  GUTTER: 20, // Space between columns in mm

  // Page margins
  MARGIN: {
    TOP: 40, // in points
    BOTTOM: 40, // in points
    LEFT: 40, // in points
    RIGHT: 40, // in points
  },

  // Font sizes (in points)
  FONT: {
    TITLE: 24,
    SECTION_TITLE: 14,
    SUBTITLE: 12,
    BODY: 11,
    SMALL: 10,
  },

  // Common spacing values for PDF layout
  SPACING: {
    // Vertical space between section title and underline
    HEADING_UNDERLINE: 6,
    // Vertical space after section title underline
    SECTION_HEADER: 20,
    // Vertical space between list items
    LIST_ITEM: 25,
    // Circle bullet point radius
    BULLET_RADIUS: 2,
    // Horizontal space between bullet and text
    BULLET_TEXT_PADDING: 10,
    // Vertical adjustment for bullet alignment
    BULLET_Y_OFFSET: 4,
    // Space after section content (before next section)
    SECTION_BOTTOM_MARGIN: 30,
  },
} as const;

export default LAYOUT;
