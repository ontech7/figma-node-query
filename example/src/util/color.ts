type FigmaRGBA = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export function figmaRgbaToHtmlRgba(color: FigmaRGBA): FigmaRGBA {
  return {
    r: Math.round(color.r * 255),
    g: Math.round(color.g * 255),
    b: Math.round(color.b * 255),
    a: Math.round(color.a * 255),
  };
}

export function figmaRgbaToHtmlHex(color: FigmaRGBA): string {
  const { r, g, b, a } = figmaRgbaToHtmlRgba(color);

  const strRGB = `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  const strAlpha = a !== 255 ? a.toString(16).padStart(2, "0") : "";

  return (strRGB + strAlpha).toUpperCase();
}
