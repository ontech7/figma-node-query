import "dotenv/config";
import type { JSONObject } from "./types";
export declare class FigmaNodeClient {
    private fileKey;
    private token;
    private _fileName?;
    private _lastModified?;
    private _ttl;
    constructor(fileKey: string, ttl?: number);
    static clearCache(): void;
    get fileName(): string | undefined;
    get lastModified(): string | undefined;
    node(nodeId: string): Promise<FigmaNodeCollection>;
    private fetchNode;
    private findNode;
}
type LookupKey = "id" | "type" | "name";
type LookupMode = "alike" | "starts-with" | "ends-with" | undefined;
type Finder = (node: JSONObject, value: string, lookupKey: LookupKey, lookupMode: LookupMode, array: JSONObject[]) => JSONObject[];
declare class FigmaNodeCollection {
    private nodes;
    private finder;
    private single;
    constructor(nodes: JSONObject[], finder: Finder, single?: boolean);
    private parseSelector;
    get(selector: string): FigmaNodeCollection;
    getAll(selector: string): FigmaNodeCollection;
    toJSON<T extends JSONObject = JSONObject>(): T;
    toJSON<T extends JSONObject = JSONObject>(): T[];
}
export {};
