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
    get ttl(): number;
    get fileName(): string | undefined;
    get lastModified(): string | undefined;
    node(nodeId: string): Promise<FigmaNodeCollection>;
    private fetchNode;
    private findNode;
}
declare class FigmaNodeCollection {
    private nodes;
    private finder;
    private single;
    constructor(nodes: JSONObject[], finder: (node: JSONObject, name: string) => JSONObject[], single?: boolean);
    get(name: string): FigmaNodeCollection;
    getAll(name: string): FigmaNodeCollection;
    toJSON<T extends JSONObject = JSONObject>(): T;
    toJSON<T extends JSONObject = JSONObject>(): T[];
}
export {};
