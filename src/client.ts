import "dotenv/config";
import type { JSONObject } from "./types";

type CacheEntry = {
  timestamp: number;
  data: JSONObject;
};

const TTL_ONE_MIN = 60_000;
const cache: Map<string, CacheEntry> = new Map();

const FIGMA_API_URL = "https://api.figma.com/v1";

export class FigmaNodeClient {
  private fileKey: string;
  private token: string;
  private _fileName?: string;
  private _lastModified?: string;
  private _ttl: number = TTL_ONE_MIN;

  constructor(fileKey: string, ttl?: number) {
    this.fileKey = fileKey;

    if (ttl) {
      this._ttl = ttl;
    }

    if (!process.env.FIGMA_TOKEN) {
      throw new Error("Missing FIGMA_TOKEN.");
    }

    this.token = process.env.FIGMA_TOKEN;
  }

  static clearCache() {
    cache.clear();
  }

  public get fileName(): string | undefined {
    return this._fileName;
  }

  public get lastModified(): string | undefined {
    return this._lastModified;
  }

  public async node(nodeId: string): Promise<FigmaNodeCollection> {
    const root = await this.fetchNode(nodeId);
    return new FigmaNodeCollection([root], this.findNode.bind(this));
  }

  private async fetchNode(nodeId: string): Promise<JSONObject> {
    const key = `${this.fileKey}:${nodeId}`;
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now - cached.timestamp < this._ttl) {
      return cached.data;
    }

    const res = await fetch(
      `${FIGMA_API_URL}/files/${this.fileKey}/nodes?ids=${nodeId}`,
      { headers: { "X-Figma-Token": this.token } }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch Figma file: " + res.status);
    }

    const data = await res.json();

    this._fileName = data.name;
    this._lastModified = data.lastModified;

    cache.set(key, { timestamp: now, data });

    return data;
  }

  private findNode(
    node: JSONObject,
    value: string,
    lookupKey: LookupKey,
    lookupMode: LookupMode,
    results: JSONObject[] = []
  ): JSONObject[] {
    if (Array.isArray(node)) {
      for (const item of node) {
        this.findNode(item, value, lookupKey, lookupMode, results);
      }
    } else if (node && typeof node === "object") {
      const obj = node as JSONObject;

      if (
        obj[lookupKey] &&
        (lookupMode === undefined
          ? String(obj[lookupKey]) === value
          : lookupMode === "alike"
          ? String(obj[lookupKey]).includes(value)
          : lookupMode === "starts-with"
          ? String(obj[lookupKey]).startsWith(value)
          : lookupMode === "ends-with"
          ? String(obj[lookupKey]).endsWith(value)
          : false)
      ) {
        results.push(obj);
      }

      for (const k in obj) {
        this.findNode(
          obj[k] as JSONObject,
          value,
          lookupKey,
          lookupMode,
          results
        );
      }
    }

    return results;
  }
}

type LookupKey = "id" | "type" | "name";
type LookupMode = "alike" | "starts-with" | "ends-with" | undefined;
type Finder = (
  node: JSONObject,
  value: string,
  lookupKey: LookupKey,
  lookupMode: LookupMode,
  array: JSONObject[]
) => JSONObject[];

class FigmaNodeCollection {
  private nodes: JSONObject[];
  private finder: Finder;
  private single: boolean;

  constructor(nodes: JSONObject[], finder: Finder, single = true) {
    this.nodes = nodes;
    this.finder = finder;
    this.single = single;
  }

  private parseSelector(selector: string): {
    selector: string;
    lookupKey: LookupKey;
    lookupMode?: LookupMode;
  } {
    let lookupKey: LookupKey = "name";
    let lookupMode: LookupMode | undefined;

    if (selector.startsWith("#")) {
      lookupKey = "id";
      selector = selector.slice(1);
    } else if (selector.startsWith("@")) {
      lookupKey = "type";
      selector = selector.slice(1);
    } else if (selector.startsWith("~")) {
      lookupMode = "alike";
      selector = selector.slice(1);
    } else if (selector.startsWith("^")) {
      lookupMode = "starts-with";
      selector = selector.slice(1);
    } else if (selector.startsWith("$")) {
      lookupMode = "ends-with";
      selector = selector.slice(1);
    }

    return { selector, lookupKey, lookupMode };
  }

  get(selector: string): FigmaNodeCollection {
    const {
      selector: parsedSelector,
      lookupKey,
      lookupMode,
    } = this.parseSelector(selector);

    for (const node of this.nodes) {
      const found = this.finder(
        node,
        parsedSelector,
        lookupKey,
        lookupMode,
        []
      );

      if (found.length > 0) {
        return new FigmaNodeCollection([found[0]], this.finder, true);
      }
    }

    throw new Error(`Node with selector "${selector}" not found`);
  }

  getAll(selector: string): FigmaNodeCollection {
    const {
      selector: parsedSelector,
      lookupKey,
      lookupMode,
    } = this.parseSelector(selector);

    const results: JSONObject[] = [];

    for (const node of this.nodes) {
      this.finder(node, parsedSelector, lookupKey, lookupMode, results);
    }

    return new FigmaNodeCollection(results, this.finder, false);
  }

  toJSON<T extends JSONObject = JSONObject>(): T;
  toJSON<T extends JSONObject = JSONObject>(): T[];
  toJSON<T extends JSONObject = JSONObject>(): T | T[] {
    return this.single ? (this.nodes[0] as T) : (this.nodes as T[]);
  }
}
