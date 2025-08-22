import { FigmaNodeClient } from "@ontech7/figma-node-query";

type FigmaRGBA = {
  r: number;
  g: number;
  b: number;
  a: number;
};

function rgbaToHex(color: FigmaRGBA): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round(color.a * 255);

  const strRGB = `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  const strAlpha = a !== 255 ? a.toString(16).padStart(2, "0") : "";

  return (strRGB + strAlpha).toUpperCase();
}

async function runExample() {
  if (!process.env.FIGMA_FILE_KEY) {
    throw new Error("Missing FIGMA_FILE_KEY in environment variables.");
  }

  const figmaClient = new FigmaNodeClient(process.env.FIGMA_FILE_KEY);

  const node = await figmaClient.node("8-5");
  const secondaryButton = node
    .get("Wrapper")
    .get("Secondary btn")
    .toJSON<{ backgroundColor: FigmaRGBA }>();
  const bgColor = secondaryButton.backgroundColor;

  console.log("HEX Color:", rgbaToHex(bgColor));
}

runExample().catch((error) => console.log(error.message));
