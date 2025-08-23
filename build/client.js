import "dotenv/config";
const TTL_ONE_MIN = 60_000;
const cache = new Map();
const FIGMA_API_URL = "https://api.figma.com/v1";
export class FigmaNodeClient {
    fileKey;
    token;
    _fileName;
    _lastModified;
    _ttl = TTL_ONE_MIN;
    constructor(fileKey, ttl) {
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
    get fileName() {
        return this._fileName;
    }
    get lastModified() {
        return this._lastModified;
    }
    async node(nodeId) {
        const root = await this.fetchNode(nodeId);
        return new FigmaNodeCollection([root], this.findNode.bind(this));
    }
    async fetchNode(nodeId) {
        const key = `${this.fileKey}:${nodeId}`;
        const now = Date.now();
        const cached = cache.get(key);
        if (cached && now - cached.timestamp < this._ttl) {
            return cached.data;
        }
        const res = await fetch(`${FIGMA_API_URL}/files/${this.fileKey}/nodes?ids=${nodeId}`, { headers: { "X-Figma-Token": this.token } });
        if (!res.ok) {
            throw new Error("Failed to fetch Figma file: " + res.status);
        }
        const data = await res.json();
        this._fileName = data.name;
        this._lastModified = data.lastModified;
        cache.set(key, { timestamp: now, data });
        return data;
    }
    findNode(node, value, lookupKey, lookupMode, results = []) {
        if (Array.isArray(node)) {
            for (const item of node) {
                this.findNode(item, value, lookupKey, lookupMode, results);
            }
        }
        else if (node && typeof node === "object") {
            const obj = node;
            if (obj[lookupKey] &&
                (lookupMode === undefined
                    ? String(obj[lookupKey]) === value
                    : lookupMode === "alike"
                        ? String(obj[lookupKey]).includes(value)
                        : lookupMode === "starts-with"
                            ? String(obj[lookupKey]).startsWith(value)
                            : lookupMode === "ends-with"
                                ? String(obj[lookupKey]).endsWith(value)
                                : false)) {
                results.push(obj);
            }
            for (const k in obj) {
                this.findNode(obj[k], value, lookupKey, lookupMode, results);
            }
        }
        return results;
    }
}
class FigmaNodeCollection {
    nodes;
    finder;
    single;
    constructor(nodes, finder, single = true) {
        this.nodes = nodes;
        this.finder = finder;
        this.single = single;
    }
    parseSelector(selector) {
        let lookupKey = "name";
        let lookupMode;
        if (selector.startsWith("#")) {
            lookupKey = "id";
            selector = selector.slice(1);
        }
        else if (selector.startsWith("@")) {
            lookupKey = "type";
            selector = selector.slice(1);
        }
        else if (selector.startsWith("~")) {
            lookupMode = "alike";
            selector = selector.slice(1);
        }
        else if (selector.startsWith("^")) {
            lookupMode = "starts-with";
            selector = selector.slice(1);
        }
        else if (selector.startsWith("$")) {
            lookupMode = "ends-with";
            selector = selector.slice(1);
        }
        return { selector, lookupKey, lookupMode };
    }
    get(selector) {
        const { selector: parsedSelector, lookupKey, lookupMode, } = this.parseSelector(selector);
        for (const node of this.nodes) {
            const found = this.finder(node, parsedSelector, lookupKey, lookupMode, []);
            if (found.length > 0) {
                return new FigmaNodeCollection([found[0]], this.finder, true);
            }
        }
        throw new Error(`Node with selector "${selector}" not found`);
    }
    getAll(selector) {
        const { selector: parsedSelector, lookupKey, lookupMode, } = this.parseSelector(selector);
        const results = [];
        for (const node of this.nodes) {
            this.finder(node, parsedSelector, lookupKey, lookupMode, results);
        }
        return new FigmaNodeCollection(results, this.finder, false);
    }
    toJSON() {
        return this.single ? this.nodes[0] : this.nodes;
    }
}
