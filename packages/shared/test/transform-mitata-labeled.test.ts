import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";
import { transformLabeledMitataData, isMitataJSON } from "../src/adapters/mitata.ts";

const read = async (name: string) => {
  const base = new URL("./fixtures/", import.meta.url);
  return JSON.parse(await readFile(new URL(name, base), "utf-8"));
};

test("transform labeled mitata data (two versions)", async () => {
  const v1 = await read("mitata-results-v1.json");
  const v2 = await read("mitata-results-v2.json");

  expect(isMitataJSON(v1)).toBe(true);
  expect(isMitataJSON(v2)).toBe(true);

  const output = transformLabeledMitataData([
    { label: "1.0.0", json: v1 },
    { label: "1.1.0", json: v2 },
  ]);

  expect(output.config).toBeDefined();
  expect(output.config!.type).toBe("standard");
  expect(output.config!.sort).toBe("semver");
  expect(output.config!.rawUnit).toBe("ns");

  expect(output.config!.series.map((s) => s.label)).toEqual(["1.0.0", "1.1.0"]);
  expect(output.config!.seriesX!.map((s) => s.label)).toEqual(["parse", "parser"]);
  expect(output.data).toHaveLength(2);
  expect(output.data[0].values).toEqual([205000000, 225000000]);
  expect(output.data[0].label).toBe("1.0.0");
  expect(output.data[1].values).toEqual([185000000, 205000000]);
  expect(output.data[1].label).toBe("1.1.0");
});

test("semver sort detected from labels", async () => {
  const v1 = await read("mitata-results-v1.json");
  const v2 = await read("mitata-results-v2.json");

  const output = transformLabeledMitataData([
    { label: "1.0.0", json: v1 },
    { label: "1.1.0", json: v2 },
  ]);
  expect(output.config!.sort).toBe("semver");
});

test("datetime sort detected from labels", async () => {
  const v1 = await read("mitata-results-v1.json");
  const v2 = await read("mitata-results-v2.json");

  const output = transformLabeledMitataData([
    { label: "2025-01", json: v1 },
    { label: "2025-02", json: v2 },
  ]);
  expect(output.config!.sort).toBe("datetime");
});

test("transform labeled mitata with empty samples (stats fallback)", async () => {
  const v1 = await read("mitata-results-empty-samples.json");
  const v2 = await read("mitata-results-empty-samples.json");

  expect(isMitataJSON(v1)).toBe(true);

  const output = transformLabeledMitataData([
    { label: "1.0.0", json: v1 },
    { label: "1.0.1", json: v2 },
  ]);

  expect(output.config).toBeDefined();
  expect(output.config!.rawUnit).toBe("ns");
  expect(output.config!.series.map((s) => s.label)).toEqual(["1.0.0", "1.0.1"]);
  expect(output.config!.seriesX!.map((s) => s.label)).toEqual(["parser", "parse"]);
  expect(output.data[0].values).toEqual([8928792, 10004750]);
  expect(output.data[1].values).toEqual([8928792, 10004750]);
});

test("no sort for plain labels", async () => {
  const v1 = await read("mitata-results-v1.json");
  const v2 = await read("mitata-results-v2.json");

  const output = transformLabeledMitataData([
    { label: "before", json: v1 },
    { label: "after", json: v2 },
  ]);
  expect(output.config!.sort).toBeUndefined();
});
