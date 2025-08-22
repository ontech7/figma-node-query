/**
 * @jest-environment node
 */
import { FigmaNodeClient } from "../src/client";
import type { JSONObject } from "../src/types";

const mockFetch = jest.fn();

(global as any).fetch = mockFetch;

describe("FigmaNodeClient", () => {
  const FILE_KEY = "test-file";
  const NODE_ID = "123";
  const FIGMA_TOKEN = "fake-token";

  const sampleResponse: JSONObject = {
    name: "RootFile",
    lastModified: "2023-01-01",
    document: {
      id: "123",
      name: "CTA",
      children: [
        {
          id: "a",
          name: "Primary-Button",
          children: [
            {
              id: "c",
              name: "Label",
            },
          ],
        },
        {
          id: "b",
          name: "Primary-Button",
        },
      ],
    },
  };

  beforeEach(() => {
    FigmaNodeClient.clearCache();
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    mockFetch.mockReset();
    process.env.FIGMA_TOKEN = FIGMA_TOKEN;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("throws if FIGMA_TOKEN is missing", () => {
    delete process.env.FIGMA_TOKEN;
    expect(() => new FigmaNodeClient(FILE_KEY)).toThrow("Missing FIGMA_TOKEN.");
  });

  it("respects default ttl", () => {
    const client = new FigmaNodeClient(FILE_KEY);
    expect(client.ttl).toBe(60_000);
  });

  it("respects custom ttl", () => {
    const client = new FigmaNodeClient(FILE_KEY, 5000);
    expect(client.ttl).toBe(5000);
  });

  it("fetches node and caches the response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleResponse,
    });

    const client = new FigmaNodeClient(FILE_KEY, 10000);

    const node = await client.node(NODE_ID);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(node.toJSON()).toEqual(sampleResponse);
    expect(client.fileName).toBe("RootFile");
    expect(client.lastModified).toBe("2023-01-01");

    const again = await client.node(NODE_ID);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(again.toJSON()).toEqual(sampleResponse);
  });

  it("refetches after ttl expires", async () => {
    let fetchCallCount = 0;
    let now = 1000;

    mockFetch.mockImplementation(async () => {
      fetchCallCount++;
      return {
        ok: true,
        json: async () => sampleResponse,
      };
    });

    jest.spyOn(Date, "now").mockImplementation(() => now);

    const client = new FigmaNodeClient(FILE_KEY, 5);

    await client.node(NODE_ID);
    expect(fetchCallCount).toBe(1);

    now += 10;

    await client.node(NODE_ID);
    expect(fetchCallCount).toBe(2);

    (Date.now as jest.MockedFunction<typeof Date.now>).mockRestore();
  });

  it("get() find one node", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    });

    const client = new FigmaNodeClient(FILE_KEY);

    const node = await client.node(NODE_ID);

    expect(node.get("Primary-Button").toJSON()).toMatchObject({
      id: "a",
      name: "Primary-Button",
      children: [
        {
          id: "c",
          name: "Label",
        },
      ],
    });
  });

  it("getAll() find two nodes", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    });

    const client = new FigmaNodeClient(FILE_KEY);

    const node = await client.node(NODE_ID);

    const primaryButtons = node.getAll("Primary-Button").toJSON();

    expect(primaryButtons).toHaveLength(2);
    expect(primaryButtons).toMatchObject([
      {
        id: "a",
        name: "Primary-Button",
        children: [
          {
            id: "c",
            name: "Label",
          },
        ],
      },
      {
        id: "b",
        name: "Primary-Button",
      },
    ]);
  });
});
