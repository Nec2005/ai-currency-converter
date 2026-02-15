import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("Currency Converter API Integration Tests", () => {
  describe("GET /", () => {
    it("returns health check response", async () => {
      const response = await SELF.fetch("https://example.com/");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(data.message).toBe("Currency Converter API");
    });
  });

  describe("GET /currencies", () => {
    it("returns list of all currencies", async () => {
      const response = await SELF.fetch("https://example.com/currencies");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currencies).toBeDefined();
      expect(Array.isArray(data.currencies)).toBe(true);
      expect(data.currencies.length).toBeGreaterThan(0);
      // Check structure
      expect(data.currencies[0]).toHaveProperty("code");
      expect(data.currencies[0]).toHaveProperty("name");
    });
  });

  describe("GET /currencies/{code}", () => {
    it("returns details for valid currency", async () => {
      const response = await SELF.fetch("https://example.com/currencies/EUR");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe("EUR");
      expect(data.name).toBeDefined();
      expect(data.rateToUSD).toBeDefined();
      expect(data.effectiveDate).toBeDefined();
    });

    it("returns error for invalid currency", async () => {
      const response = await SELF.fetch("https://example.com/currencies/XYZ");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("INVALID_CURRENCY");
    });
  });

  describe("GET /rate", () => {
    it("returns exchange rate for valid currencies", async () => {
      const response = await SELF.fetch(
        "https://example.com/rate?from=USD&to=EUR"
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.from).toBe("USD");
      expect(data.to).toBe("EUR");
      expect(typeof data.rate).toBe("number");
      expect(data.effectiveDate).toBeDefined();
    });

    it("returns error for missing parameters", async () => {
      const response = await SELF.fetch("https://example.com/rate?from=USD");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("MISSING_PARAMETER");
    });
  });

  describe("GET /rates", () => {
    it("returns all rates with default USD base", async () => {
      const response = await SELF.fetch("https://example.com/rates");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.base).toBe("USD");
      expect(data.rates).toBeDefined();
      expect(data.rates.USD).toBe(1);
    });

    it("returns rates with custom base currency", async () => {
      const response = await SELF.fetch("https://example.com/rates?base=EUR");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.base).toBe("EUR");
      expect(data.rates.EUR).toBe(1);
    });
  });

  describe("GET /convert", () => {
    it("converts amount between currencies", async () => {
      const response = await SELF.fetch(
        "https://example.com/convert?from=USD&to=EUR&amount=100"
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.from).toBe("USD");
      expect(data.to).toBe("EUR");
      expect(data.amount).toBe(100);
      expect(typeof data.convertedAmount).toBe("number");
      expect(typeof data.rate).toBe("number");
      expect(typeof data.totalCurrencies).toBe("number");
      expect(data.totalCurrencies).toBeGreaterThan(0);
    });

    it("returns error for invalid amount", async () => {
      const response = await SELF.fetch(
        "https://example.com/convert?from=USD&to=EUR&amount=invalid"
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("INVALID_AMOUNT");
    });
  });

  describe("POST /convert/batch", () => {
    it("converts multiple amounts", async () => {
      const response = await SELF.fetch("https://example.com/convert/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "USD",
          to: "EUR",
          amounts: [100, 250, 500],
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.from).toBe("USD");
      expect(data.to).toBe("EUR");
      expect(data.conversions).toHaveLength(3);
      expect(data.conversions[0].amount).toBe(100);
    });

    it("returns error for invalid JSON", async () => {
      const response = await SELF.fetch("https://example.com/convert/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("MISSING_PARAMETER");
    });

    it("returns error for missing amounts", async () => {
      const response = await SELF.fetch("https://example.com/convert/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "USD",
          to: "EUR",
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("MISSING_PARAMETER");
    });
  });

  describe("Error handling", () => {
    it("returns 404 for unknown endpoint", async () => {
      const response = await SELF.fetch("https://example.com/unknown");
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe("NOT_FOUND");
    });

    it("returns 405 for unsupported methods", async () => {
      const response = await SELF.fetch("https://example.com/currencies", {
        method: "DELETE",
      });
      const data = await response.json();

      expect(response.status).toBe(405);
    });
  });
});
