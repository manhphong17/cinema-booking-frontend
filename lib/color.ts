/**
 * Generates a deterministic, visually distinct color from a string input (e.g., a seat type name).
 * Uses the HSL color model to ensure generated colors are vibrant and not muddy.
 * @param str The input string (e.g., seat type name or ID).
 * @returns An HSL color string (e.g., "hsl(120, 70%, 50%)").
 */
export const generateColorFromString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    const hue = Math.abs(hash % 360);
    const saturation = 70; // Fixed saturation for vibrant colors
    const lightness = 50;  // Fixed lightness to avoid too dark/light colors
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
