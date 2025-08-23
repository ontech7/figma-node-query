import { FigmaNodeClient } from "@ontech7/figma-node-query";
import fs from "fs";
import { JSONObject } from "../../build/types";
import { figmaRgbaToHtmlHex, figmaRgbaToHtmlRgba } from "./util/color";
import { toCamelCase } from "./util/string";

async function exportColors() {
  const client = new FigmaNodeClient("qWrhGNCtP9avcXdYiaBVxE");

  const node = await client.node("1-5");

  const buttons = node
    .getAll("@COMPONENT")
    .getAll("^State=")
    .toJSON() as JSONObject[];

  let output = `import { Color } from "@9elt/color";`;

  for (const button of buttons) {
    const hex = figmaRgbaToHtmlHex(button.backgroundColor);
    const { r, g, b, a } = figmaRgbaToHtmlRgba(button.backgroundColor);
    output += `

/**
 * ${button.name}
 * @hex ${hex}
 */
export const ${toCamelCase(button.name)} = new Color(${r}, ${g}, ${b}, ${a});`;
  }

  fs.writeFileSync("output/button.colors.ts", output);

  console.log("Saved successfully -> output/button.colors.ts");
}

exportColors().catch((error) => console.log(error.message));
