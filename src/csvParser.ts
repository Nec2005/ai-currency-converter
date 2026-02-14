import { ExchangeRateData } from "./types";
import { getCodeFromName } from "./currencyMapping";

export interface ParsedRates {
  rates: Map<string, ExchangeRateData>;
  lastUpdated: string;
}

export function parseCSV(csvContent: string): ParsedRates {
  const lines = csvContent.trim().split("\n");
  const rates = new Map<string, ExchangeRateData>();
  let lastUpdated = "";

  // Skip header row (first line)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle potential commas in values)
    const parts = parseCSVLine(line);
    if (parts.length < 4) continue;

    const [recordDate, currencyDescription, exchangeRateStr, effectiveDate] = parts;

    // Skip header row if encountered again
    if (currencyDescription === "Country - Currency Description") continue;

    const code = getCodeFromName(currencyDescription);
    if (!code) continue; // Skip unmapped currencies

    const rate = parseFloat(exchangeRateStr);
    if (isNaN(rate)) continue;

    // Keep the most recent rate for each currency (by effective date)
    const existing = rates.get(code);
    if (!existing || effectiveDate > existing.effectiveDate) {
      rates.set(code, {
        code,
        name: currencyDescription,
        rate,
        effectiveDate,
      });
    }

    // Track the latest date in the dataset
    if (effectiveDate > lastUpdated) {
      lastUpdated = effectiveDate;
    }
  }

  // Add USD as base currency (rate = 1)
  rates.set("USD", {
    code: "USD",
    name: "United States-Dollar",
    rate: 1,
    effectiveDate: lastUpdated,
  });

  return { rates, lastUpdated };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  // Remove BOM if present
  if (line.charCodeAt(0) === 0xfeff) {
    line = line.slice(1);
  }

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
