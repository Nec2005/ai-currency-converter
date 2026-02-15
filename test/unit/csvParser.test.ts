import { describe, it, expect } from "vitest";
import { parseCSV } from "../../src/csvParser";

describe("CSV Parser", () => {
  it("parses CSV content correctly", () => {
    const csvContent = `Record Date,Country - Currency Description,Exchange Rate,Effective Date
2025-12-31,Australia-Dollar,1.495,2025-12-31
2025-12-31,Canada-Dollar,1.369,2025-12-31`;

    const result = parseCSV(csvContent);

    expect(result.rates.has("AUD")).toBe(true);
    expect(result.rates.has("CAD")).toBe(true);
    expect(result.rates.get("AUD")?.rate).toBe(1.495);
    expect(result.rates.get("CAD")?.rate).toBe(1.369);
  });

  it("handles BOM characters", () => {
    const csvContent = `\uFEFFRecord Date,Country - Currency Description,Exchange Rate,Effective Date
2025-12-31,Japan-Yen,157.5,2025-12-31`;

    const result = parseCSV(csvContent);

    expect(result.rates.has("JPY")).toBe(true);
    expect(result.rates.get("JPY")?.rate).toBe(157.5);
  });

  it("includes USD as base currency with rate 1", () => {
    const csvContent = `Record Date,Country - Currency Description,Exchange Rate,Effective Date
2025-12-31,Australia-Dollar,1.495,2025-12-31`;

    const result = parseCSV(csvContent);

    expect(result.rates.has("USD")).toBe(true);
    expect(result.rates.get("USD")?.rate).toBe(1);
  });

  it("keeps the most recent rate for each currency", () => {
    const csvContent = `Record Date,Country - Currency Description,Exchange Rate,Effective Date
2025-12-31,Australia-Dollar,1.495,2025-12-31
2025-12-31,Australia-Dollar,1.500,2026-01-15`;

    const result = parseCSV(csvContent);

    expect(result.rates.get("AUD")?.rate).toBe(1.5);
    expect(result.rates.get("AUD")?.effectiveDate).toBe("2026-01-15");
  });
});
