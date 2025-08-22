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
    get ttl() {
        return this._ttl;
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
    findNode(node, name) {
        let results = [];
        if (Array.isArray(node)) {
            for (const item of node) {
                results = results.concat(this.findNode(item, name));
            }
        }
        else if (node && typeof node === "object") {
            const obj = node;
            if (obj.name && String(obj.name) === name) {
                results.push(obj);
            }
            for (const k in obj) {
                results = results.concat(this.findNode(obj[k], name));
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
    get(name) {
        for (const node of this.nodes) {
            const found = this.finder(node, name);
            if (found.length > 0) {
                return new FigmaNodeCollection([found[0]], this.finder, true);
            }
        }
        throw new Error(`Node with name "${name}" not found`);
    }
    getAll(name) {
        let all = [];
        for (const node of this.nodes) {
            all = all.concat(this.finder(node, name));
        }
        return new FigmaNodeCollection(all, this.finder, false);
    }
    toJSON() {
        return this.single ? this.nodes[0] : this.nodes;
    }
}
