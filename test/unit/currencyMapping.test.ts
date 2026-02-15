import { describe, it, expect } from "vitest";
import {
  currencyNameToCode,
  codeToName,
  getCodeFromName,
  getNameFromCode,
  isValidCode,
} from "../../src/currencyMapping";

describe("currencyNameToCode mapping", () => {
  it("maps common currencies correctly", () => {
    expect(currencyNameToCode["Australia-Dollar"]).toBe("AUD");
    expect(currencyNameToCode["Canada-Dollar"]).toBe("CAD");
    expect(currencyNameToCode["Japan-Yen"]).toBe("JPY");
    expect(currencyNameToCode["United Kingdom-Pound"]).toBe("GBP");
    expect(currencyNameToCode["Euro Zone-Euro"]).toBe("EUR");
  });

  it("handles special characters in currency names", () => {
    expect(currencyNameToCode["Cote D'Ivoire-Cfa Franc"]).toBe("XOF");
    expect(currencyNameToCode["Antigua & Barbuda-East Caribbean Dollar"]).toBe("XCD");
    expect(currencyNameToCode["Tonga-Pa'Anga"]).toBe("TOP");
  });
});

describe("codeToName mapping", () => {
  it("maps ISO codes to currency names", () => {
    expect(codeToName["AUD"]).toBe("Australia-Dollar");
    expect(codeToName["JPY"]).toBe("Japan-Yen");
    expect(codeToName["GBP"]).toBe("United Kingdom-Pound");
  });

  it("includes USD as base currency", () => {
    expect(codeToName["USD"]).toBe("United States-Dollar");
  });
});

describe("getCodeFromName", () => {
  it("returns correct ISO code for valid currency name", () => {
    expect(getCodeFromName("Australia-Dollar")).toBe("AUD");
    expect(getCodeFromName("Japan-Yen")).toBe("JPY");
    expect(getCodeFromName("Switzerland-Franc")).toBe("CHF");
  });

  it("returns undefined for invalid currency name", () => {
    expect(getCodeFromName("Invalid-Currency")).toBeUndefined();
    expect(getCodeFromName("")).toBeUndefined();
    expect(getCodeFromName("Random String")).toBeUndefined();
  });
});

describe("getNameFromCode", () => {
  it("returns correct name for valid ISO code", () => {
    expect(getNameFromCode("AUD")).toBe("Australia-Dollar");
    expect(getNameFromCode("JPY")).toBe("Japan-Yen");
    expect(getNameFromCode("USD")).toBe("United States-Dollar");
  });

  it("returns undefined for invalid ISO code", () => {
    expect(getNameFromCode("XYZ")).toBeUndefined();
    expect(getNameFromCode("")).toBeUndefined();
    expect(getNameFromCode("INVALID")).toBeUndefined();
  });
});

describe("isValidCode", () => {
  it("returns true for valid ISO codes", () => {
    expect(isValidCode("USD")).toBe(true);
    expect(isValidCode("EUR")).toBe(true);
    expect(isValidCode("GBP")).toBe(true);
    expect(isValidCode("JPY")).toBe(true);
    expect(isValidCode("AUD")).toBe(true);
  });

  it("returns false for invalid ISO codes", () => {
    expect(isValidCode("XYZ")).toBe(false);
    expect(isValidCode("INVALID")).toBe(false);
    expect(isValidCode("")).toBe(false);
    expect(isValidCode("123")).toBe(false);
  });

  it("is case sensitive", () => {
    expect(isValidCode("usd")).toBe(false);
    expect(isValidCode("Eur")).toBe(false);
  });
});
