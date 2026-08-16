import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { calculateComparison, earthSunDistanceKm } from "../main";

describe("solar distance model", () => {
  it("keeps the Earth-Sun distance in the expected annual range", () => {
    expect(earthSunDistanceKm(3) / 1_000_000).toBeCloseTo(147.1, 1);
    expect(earthSunDistanceKm(185) / 1_000_000).toBeCloseTo(152.1, 1);
  });

  it("separates the rotational and orbital contributions", () => {
    const result = calculateComparison({ date: "2026-03-20", latitude: 35, morningHour: 8 });

    expect(result.rotationContributionKm).toBeGreaterThan(0);
    expect(result.orbitContributionKm).toBeLessThan(0);
    expect(result.totalContributionKm).toBeCloseTo(
      result.rotationContributionKm + result.orbitContributionKm,
      6,
    );
  });
});

describe("distance investigation page", () => {
  it("ships the three explanatory layers and a working comparison surface", () => {
    const distPath = resolve("dist/index.html");
    expect(existsSync(distPath), "Build the site before running this test.").toBe(true);

    const doc = new JSDOM(readFileSync(distPath, "utf8")).window.document;
    expect(doc.querySelector("#scale")).toBeTruthy();
    expect(doc.querySelector("#master")).toBeTruthy();
    expect(doc.querySelector("#ebbinghaus-illusion")).toBeTruthy();
    expect(doc.querySelector("#illusion-reveal")).toBeTruthy();
    expect(doc.querySelector("#sunrise-video")).toBeTruthy();
    expect(doc.querySelector("#noon-sun-video")).toBeTruthy();
    expect(doc.querySelector("#rotation")).toBeTruthy();
    expect(doc.querySelector("#orbit")).toBeTruthy();
    expect(doc.querySelector('[data-testid="distance-model"]')).toBeTruthy();
    expect(doc.querySelector("#comparison-date")).toBeTruthy();
    expect(doc.querySelector("#latitude")).toBeTruthy();
    expect(doc.querySelector("#morning-hour")).toBeTruthy();
  });
});
