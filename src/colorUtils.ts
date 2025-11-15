// Color conversion functions
export function hexToHSL(hex: string) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function HSLToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

export type PaletteType = 'complementary' | 'split' | 'monochromatic' | 'analogous' | 'triadic' | 'square';

// Generate complementary palette (2 colors - opposite on color wheel)
export function generateComplementaryPalette(baseHex: string): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  const complementaryH = (h + 180) % 360;
  
  return [
    HSLToHex(h, s, l),
    HSLToHex(complementaryH, s, l),
  ];
}

// Generate split-complementary palette (3 colors - base + two adjacent to complement)
export function generateSplitPalette(baseHex: string): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  const complementaryH = (h + 180) % 360;
  const split1 = (complementaryH - 30 + 360) % 360;
  const split2 = (complementaryH + 30) % 360;
  
  return [
    HSLToHex(h, s, l),
    HSLToHex(split1, s, l),
    HSLToHex(split2, s, l),
  ];
}

// Generate monochromatic palette (3 colors - same hue, different lightness)
export function generateMonochromaticPalette(baseHex: string): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  
  return [
    HSLToHex(h, s, Math.max(20, l - 20)),
    HSLToHex(h, s, l),
    HSLToHex(h, s, Math.min(90, l + 20)),
  ];
}

// Generate analogous palette (3 colors - adjacent on color wheel)
export function generateAnalogousPalette(baseHex: string): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  
  return [
    HSLToHex((h - 30 + 360) % 360, s, l),
    HSLToHex(h, s, l),
    HSLToHex((h + 30) % 360, s, l),
  ];
}

// Generate triadic palette (3 colors - 120 degrees apart)
export function generateTriadicPalette(baseHex: string): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  
  return [
    HSLToHex(h, s, l),
    HSLToHex((h + 120) % 360, s, l),
    HSLToHex((h + 240) % 360, s, l),
  ];
}

// Generate square palette (4 colors - 90 degrees apart)
export function generateSquarePalette(baseHex: string): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  
  return [
    HSLToHex(h, s, l),
    HSLToHex((h + 90) % 360, s, l),
    HSLToHex((h + 180) % 360, s, l),
    HSLToHex((h + 270) % 360, s, l),
  ];
}

// Main palette generator function
export function generatePalette(baseHex: string, type: PaletteType): string[] {
  switch (type) {
    case 'complementary':
      return generateComplementaryPalette(baseHex);
    case 'split':
      return generateSplitPalette(baseHex);
    case 'monochromatic':
      return generateMonochromaticPalette(baseHex);
    case 'analogous':
      return generateAnalogousPalette(baseHex);
    case 'triadic':
      return generateTriadicPalette(baseHex);
    case 'square':
      return generateSquarePalette(baseHex);
    default:
      return generateTriadicPalette(baseHex);
  }
}

