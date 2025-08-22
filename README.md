# figma-node-query

[![npm](https://img.shields.io/npm/v/@ontech7/figma-node-query.svg?style=flat-square)](https://www.npmjs.com/package/@ontech7/figma-node-query)
[![npm](https://img.shields.io/npm/dm/@ontech7/figma-node-query.svg?style=flat-square&colorB=007ec6)](https://www.npmjs.com/package/@ontech7/figma-node-query)

Fetch and inspect nodes within Figma files via URL and PAT, with results serialized as JSON arrays.

## Usage

```bash
npm add @ontech7/figma-node-query
# or for script purposes
npm install -D @ontech7/figma-node-query
```

Retrieve/generate your **Figma personal Access Token** from:

```bash
figma.com > Login > [Your Name] > Settings > Security > Personal access tokens > Generate new token
```

Retrieve your file-key from **Figma project URL**:

```bash
eg.: https://www.figma.com/design/[file-key]/[file-name]
```

Copy the interested node-id from the **Figma project**:

```bash
eg.: Page-name > Node-name -> Copy as -> Copy link to selection
```

```ts
// index.ts
type FigmaRGBA = { r: number; g: number; b: number; a: number };

const figmaClient = new FigmaNodeClient("<your-file-key>");

const node = await figmaClient.node("8-5");
const secondaryButton = node
  .get("Wrapper")
  .get("Secondary btn")
  .toJSON<{ backgroundColor: FigmaRGBA }>();
const bgColor = secondaryButton.backgroundColor;
```

---

## Methods

| Name                                 | Description |
| ------------------------------------ | ----------- |
| `new FigmaNodeClient(fileKey, ttl?)` | ...         |
| `ttl`                                | ...         |
| `fileName`                           | ...         |
| `lastModified`                       | ...         |
| `node(nodeId)`                       | ...         |
| `get(name)`                          | ...         |
| `getAll(name)`                       | ...         |
| `toJSON<T>()`                        | ...         |
| `FigmaNodeClient.clearCache()`       | ...         |

---

## Example

Here are simple examples:

- Check [example folder](/example/)

---

## Credits

Written by [Andrea Losavio](https://linkedin.com/in/andrea-losavio).
