import { describe, it, expect, beforeAll } from "vitest";
import {
  handleHealthCheck,
  handleListCurrencies,
  handleGetRate,
  handleConvert,
  handleGetAllRates,
  handleGetCurrencyDetail,
  handleBatchConvert,
} from "../../src/handlers";
import { ExchangeRateData } from "../../src/types";

// Mock exchange rates for testing
const mockRates = new Map<string, ExchangeRateData>([
  ["USD", { code: "USD", name: "United States-Dollar", rate: 1, effectiveDate: "2025-12-31" }],
  ["EUR", { code: "EUR", name: "Euro Zone-Euro", rate: 0.851, effectiveDate: "2025-12-31" }],
  ["GBP", { code: "GBP", name: "United Kingdom-Pound", rate: 0.79, effectiveDate: "2025-12-31" }],
  ["JPY", { code: "JPY", name: "Japan-Yen", rate: 157.5, effectiveDate: "2025-12-31" }],
]);

describe("handleHealthCheck", () => {
  it("returns status ok", async () => {
    const response = handleHealthCheck();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.message).toBe("Currency Converter API");
  });
});

describe("handleListCurrencies", () => {
  it("returns sorted list of currencies", async () => {
    const response = handleListCurrencies(mockRates);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.currencies).toHaveLength(4);
    expect(data.currencies[0].code).toBe("EUR");
    expect(data.currencies[3].code).toBe("USD");
  });
});

describe("handleGetRate", () => {
  it("returns correct rate for USD to EUR", async () => {
    const url = new URL("http://localhost/rate?from=USD&to=EUR");
    const response = handleGetRate(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.from).toBe("USD");
    expect(data.to).toBe("EUR");
    expect(data.rate).toBe(0.851);
  });

  it("returns correct rate for EUR to GBP", async () => {
    const url = new URL("http://localhost/rate?from=EUR&to=GBP");
    const response = handleGetRate(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(200);
    // GBP/EUR = 0.79 / 0.851 ≈ 0.928319
    expect(data.rate).toBeCloseTo(0.928319, 4);
  });

  it("returns error for missing parameters", async () => {
    const url = new URL("http://localhost/rate?from=USD");
    const response = handleGetRate(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("MISSING_PARAMETER");
  });

  it("returns error for invalid currency", async () => {
    const url = new URL("http://localhost/rate?from=USD&to=XYZ");
    const response = handleGetRate(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_CURRENCY");
  });
});

describe("handleConvert", () => {
  it("converts 100 USD to EUR correctly", async () => {
    const url = new URL("http://localhost/convert?from=USD&to=EUR&amount=100");
    const response = handleConvert(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.amount).toBe(100);
    expect(data.convertedAmount).toBe(85.1);
    expect(data.rate).toBe(0.851);
  });

  it("returns error for invalid amount", async () => {
    const url = new URL("http://localhost/convert?from=USD&to=EUR&amount=abc");
    const response = handleConvert(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_AMOUNT");
  });

  it("returns error for missing amount", async () => {
    const url = new URL("http://localhost/convert?from=USD&to=EUR");
    const response = handleConvert(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("MISSING_PARAMETER");
  });
});

describe("handleGetAllRates", () => {
  it("returns all rates with USD as default base", async () => {
    const url = new URL("http://localhost/rates");
    const response = handleGetAllRates(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.base).toBe("USD");
    expect(data.rates.USD).toBe(1);
    expect(data.rates.EUR).toBe(0.851);
  });

  it("returns rates relative to EUR base", async () => {
    const url = new URL("http://localhost/rates?base=EUR");
    const response = handleGetAllRates(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.base).toBe("EUR");
    expect(data.rates.EUR).toBe(1);
    // USD/EUR = 1 / 0.851 ≈ 1.175
    expect(data.rates.USD).toBeCloseTo(1.175, 2);
  });

  it("returns error for invalid base currency", async () => {
    const url = new URL("http://localhost/rates?base=XYZ");
    const response = handleGetAllRates(url, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_CURRENCY");
  });
});

describe("handleGetCurrencyDetail", () => {
  it("returns details for valid currency", async () => {
    const response = handleGetCurrencyDetail("EUR", mockRates);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.code).toBe("EUR");
    expect(data.name).toBe("Euro Zone-Euro");
    expect(data.rateToUSD).toBe(0.851);
  });

  it("handles lowercase currency code", async () => {
    const response = handleGetCurrencyDetail("eur", mockRates);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.code).toBe("EUR");
  });

  it("returns error for invalid currency", async () => {
    const response = handleGetCurrencyDetail("XYZ", mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_CURRENCY");
  });
});

describe("handleBatchConvert", () => {
  it("converts multiple amounts correctly", async () => {
    const request = new Request("http://localhost/convert/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "USD",
        to: "EUR",
        amounts: [100, 250, 500],
      }),
    });

    const response = await handleBatchConvert(request, mockRates);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.from).toBe("USD");
    expect(data.to).toBe("EUR");
    expect(data.conversions).toHaveLength(3);
    expect(data.conversions[0].amount).toBe(100);
    expect(data.conversions[0].convertedAmount).toBe(85.1);
    expect(data.conversions[1].amount).toBe(250);
    expect(data.conversions[2].amount).toBe(500);
  });

  it("returns error for invalid JSON body", async () => {
    const request = new Request("http://localhost/convert/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json",
    });

    const response = await handleBatchConvert(request, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("MISSING_PARAMETER");
  });

  it("returns error for missing parameters", async () => {
    const request = new Request("http://localhost/convert/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: "USD" }),
    });

    const response = await handleBatchConvert(request, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("MISSING_PARAMETER");
  });

  it("returns error for empty amounts array", async () => {
    const request = new Request("http://localhost/convert/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "USD",
        to: "EUR",
        amounts: [],
      }),
    });

    const response = await handleBatchConvert(request, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_AMOUNT");
  });

  it("returns error for invalid amounts in array", async () => {
    const request = new Request("http://localhost/convert/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "USD",
        to: "EUR",
        amounts: [100, "invalid", 300],
      }),
    });

    const response = await handleBatchConvert(request, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_AMOUNT");
  });

  it("returns error for invalid currency", async () => {
    const request = new Request("http://localhost/convert/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "USD",
        to: "XYZ",
        amounts: [100],
      }),
    });

    const response = await handleBatchConvert(request, mockRates);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_CURRENCY");
  });
});
