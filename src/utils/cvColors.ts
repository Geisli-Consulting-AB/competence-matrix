export const CV_COLORS = [
  "#1e1e1e", // Default/Dark Gray
  "#2d1b1b", // Deep Red
  "#1b262d", // Deep Blue/Navy
  "#261b2d", // Deep Purple
  "#1b2d26", // Deep Emerald
  "#2d261b", // Deep Bronze/Gold
  "#2d1b26", // Deep Magenta/Fuchsia
  "#1b2d2d", // Deep Cyan/Teal
  "#2d2d1b", // Deep Olive
  "#262626", // Medium Gray
  "#1a2a3a", // Dark Blue
  "#3a1a2a", // Dark Maroon
  "#1a3a2a", // Dark Forest
  "#2a1a3a", // Dark Indigo
  "#3a2a1a", // Dark Sepia
  "#1a3a3a", // Dark Slate
  "#3a3a1a", // Dark Olive Green
  "#2a3a1a", // Dark Moss
  "#1a2a2a", // Dark Charcoal
  "#2a1a1a", // Very Deep Red
];

export const getCvColor = (id: string | null | undefined): string => {
  if (!id) return "transparent";
  
  // If the ID is a hex color (backwards compatibility or manual override)
  if (id.startsWith("#")) return id;

  // If the ID contains a color index hint at the end (e.g. "some-id-c1")
  const match = id.match(/-c(\d+)$/);
  if (match) {
    const index = parseInt(match[1], 10);
    if (index >= 0 && index < CV_COLORS.length) {
      return CV_COLORS[index];
    }
    // If index is out of bounds (palette shrunk), use modulo
    return CV_COLORS[index % CV_COLORS.length];
  }

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CV_COLORS.length;
  return CV_COLORS[index];
};

export const generateIdWithUnusedColor = (existingIds: string[]): string => {
  const colorCounts = new Array(CV_COLORS.length).fill(0);
  
  existingIds.forEach(id => {
    const color = getCvColor(id);
    const index = CV_COLORS.indexOf(color);
    if (index !== -1) {
      colorCounts[index]++;
    }
  });

  // Find the index with the minimum count
  let minCount = Infinity;
  let targetIndex = 0;
  
  // We prefer unused colors (count === 0)
  for (let i = 0; i < colorCounts.length; i++) {
    if (colorCounts[i] < minCount) {
      minCount = colorCounts[i];
      targetIndex = i;
    }
    if (minCount === 0) break; // Optimization: found an unused color
  }

  const baseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${baseId}-c${targetIndex}`;
};

export const getDarkerColor = (color: string): string => {
  // Simple helper to darken hex color for borders or active states if needed
  // For now we just return the same color or a hardcoded variant
  return color;
};
