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

  public get ttl(): number {
    return this._ttl;
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

  private findNode(node: JSONObject, name: string): JSONObject[] {
    let results: JSONObject[] = [];

    if (Array.isArray(node)) {
      for (const item of node) {
        results = results.concat(this.findNode(item, name));
      }
    } else if (node && typeof node === "object") {
      const obj = node as JSONObject;

      if (obj.name && String(obj.name) === name) {
        results.push(obj);
      }

      for (const k in obj) {
        results = results.concat(this.findNode(obj[k] as JSONObject, name));
      }
    }

    return results;
  }
}

class FigmaNodeCollection {
  private nodes: JSONObject[];
  private finder: (node: JSONObject, name: string) => JSONObject[];
  private single: boolean;

  constructor(
    nodes: JSONObject[],
    finder: (node: JSONObject, name: string) => JSONObject[],
    single = true
  ) {
    this.nodes = nodes;
    this.finder = finder;
    this.single = single;
  }

  get(name: string): FigmaNodeCollection {
    for (const node of this.nodes) {
      const found = this.finder(node, name);
      if (found.length > 0) {
        return new FigmaNodeCollection([found[0]], this.finder, true);
      }
    }
    throw new Error(`Node with name "${name}" not found`);
  }

  getAll(name: string): FigmaNodeCollection {
    let all: JSONObject[] = [];
    for (const node of this.nodes) {
      all = all.concat(this.finder(node, name));
    }
    return new FigmaNodeCollection(all, this.finder, false);
  }

  toJSON<T extends JSONObject = JSONObject>(): T;
  toJSON<T extends JSONObject = JSONObject>(): T[];
  toJSON<T extends JSONObject = JSONObject>(): T | T[] {
    return this.single ? (this.nodes[0] as T) : (this.nodes as T[]);
  }
}
