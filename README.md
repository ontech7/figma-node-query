# figma-node-query

[![npm](https://img.shields.io/npm/v/@ontech7/figma-node-query.svg?style=flat-square)](https://www.npmjs.com/package/@ontech7/figma-node-query)
[![npm](https://img.shields.io/npm/dm/@ontech7/figma-node-query.svg?style=flat-square&colorB=007ec6)](https://www.npmjs.com/package/@ontech7/figma-node-query)

Fetch and inspect nodes within Figma files via URL and PAT, with results serialized as JSON arrays.

---

## Usage

```bash
npm install @ontech7/figma-node-query dotenv
# or
npm install -D @ontech7/figma-node-query dotenv
```

Retrieve/generate your **Figma personal Access Token** from:

```bash
figma.com > Login > [Your Name] > Settings > Security > Personal access tokens > Generate new token
```

Retrieve your file-key from **Figma project URL**:

```bash
URL-like: https://www.figma.com/design/[file-key]/[file-name]

eg.: https://www.figma.com/design/qWrhGNCtP9avcXdYiaBVxE/%F0%9F%94%AE-Buttons-Library--Community-

[file-key] => qWrhGNCtP9avcXdYiaBVxE
[file-name] => Buttons Library (Community)
```

Copy the interested node-id from the **Figma project**:

```bash
Page-name > Node-name -> Copy as -> Copy link to selection

URL-like: https://www.figma.com/design/[file-key]/[file-name]?node-id=[node-id]

eg.: https://www.figma.com/design/qWrhGNCtP9avcXdYiaBVxE/%F0%9F%94%AE-Buttons-Library--Community-?node-id=1-5

[node-id] => 1-5
```

Import FigmaNodeClient to your project:

```ts
// index.ts
import { FigmaNodeClient } from "@ontech7/figma-node-query";

type FigmaRGBA = { r: number; g: number; b: number; a: number };

const client = new FigmaNodeClient("qWrhGNCtP9avcXdYiaBVxE"); // initialize client with [file-name]

const node = await client.node("1-5"); // call Figma API with [node-id] to generate a FigmaNodeCollection instance

const secondaryButton = node
  .getAll("@COMPONENT") // search for all nodes with type = "COMPONENT"
  .get("~State=") // search for first node with name that starts with "State="
  .toJSON<{ backgroundColor: FigmaRGBA }>(); // transforms FigmaNodeCollection to serializable JSON object

console.log(secondaryButton.backgroundColor);

// { r: 0.12083333730697632, g: 0.5074999332427979, b: 0.7250000238418579, a: 1 }
```

---

## Methods

| Name                                 | Description                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `new FigmaNodeClient(fileKey, ttl?)` | Instance of a Figma client                                                   |
| `fileName`                           | Title of the Figma file                                                      |
| `lastModified`                       | Date of the last update done by an author of the Figma file                  |
| `node(nodeId)`                       | Calls Figma API to retrieve the node by [node-id]                            |
| `get(selector)`                      | Retrieve the first node with specified selector. Throws error if no match.   |
| `getAll(selector)`                   | Retrieve all nodes with specified selector. Returns empty array if no match. |
| `toJSON<T>()`                        | Result as JSONObject (or JSONObject if getAll method)                        |
| `FigmaNodeClient.clearCache()`       | Clear any current cache                                                      |

---

## Special Lookup Tokens

| Name | Description                                                      |
| ---- | ---------------------------------------------------------------- |
| `#`  | Look up for `id`                                                 |
| `@`  | Look up for `type`                                               |
| `~`  | Look up for `name` if `alike` (a.k.a. `s1.includes(s2)`)         |
| `^`  | Look up for `name` if `starts-with` (a.k.a. `s1.startsWith(s2)`) |
| `$`  | Look up for `name` if `starts-with` (a.k.a. `s1.endWith(s2)`)    |

---

## Example

Here are simple examples:

- Check [example folder](/example/)

---

## Credits

Written by [Andrea Losavio](https://linkedin.com/in/andrea-losavio).
