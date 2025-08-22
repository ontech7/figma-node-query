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
  const client = new FigmaNodeClient("qWrhGNCtP9avcXdYiaBVxE");

  const node = await client.node("1-5");

  const buttonSection = node.get("Button").toJSON();
  const firstButton = buttonSection.children?.[0];
  console.log("HEX Color:", rgbaToHex(firstButton?.backgroundColor));

  const buttonText = node.get("#1:7").toJSON();
  console.log("Font Family:", buttonText.style.fontFamily);

  const firstButtonLabel = node.getAll("@COMPONENT").get("~State=").toJSON();
  console.log("Font Properties:", firstButtonLabel);
}

runExample().catch((error) => console.log(error.message));
