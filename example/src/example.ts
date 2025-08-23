import { FigmaNodeClient } from "@ontech7/figma-node-query";
import { figmaRgbaToHtmlHex } from "./util/color";

async function runExample() {
  const client = new FigmaNodeClient("qWrhGNCtP9avcXdYiaBVxE");

  const node = await client.node("1-5");

  const buttonSection = node.get("Button").toJSON();
  const firstButton = buttonSection.children?.[0];
  console.log("HEX Color:", figmaRgbaToHtmlHex(firstButton?.backgroundColor));

  const buttonText = node.get("#1:7").toJSON();
  console.log("Font Family:", buttonText.style.fontFamily);

  const firstButtonLabel = node.getAll("@COMPONENT").get("~State=").toJSON();
  console.log("Font Properties:", firstButtonLabel);
}

runExample().catch((error) => console.log(error.message));
