import {
  ApiError,
  CurrenciesResponse,
  ConversionResponse,
  HealthResponse,
  RateResponse,
  ExchangeRateData,
} from "./types";
import { isValidCode, getNameFromCode } from "./currencyMapping";

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(
  error: string,
  code: ApiError["code"],
  status: number
): Response {
  const body: ApiError = { error, code };
  return jsonResponse(body, status);
}

export function handleHealthCheck(): Response {
  const response: HealthResponse = {
    status: "ok",
    message: "Currency Converter API",
  };
  return jsonResponse(response);
}

export function handleListCurrencies(
  rates: Map<string, ExchangeRateData>
): Response {
  const currencies = Array.from(rates.values())
    .map((r) => ({
      code: r.code,
      name: r.name,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const response: CurrenciesResponse = { currencies };
  return jsonResponse(response);
}

export function handleGetRate(
  url: URL,
  rates: Map<string, ExchangeRateData>
): Response {
  const from = url.searchParams.get("from")?.toUpperCase();
  const to = url.searchParams.get("to")?.toUpperCase();

  // Validate required parameters
  if (!from || !to) {
    return errorResponse(
      "Missing required parameters: from and to",
      "MISSING_PARAMETER",
      400
    );
  }

  // Validate currency codes
  if (!isValidCode(from) || !rates.has(from)) {
    return errorResponse(
      `Invalid currency code: ${from}`,
      "INVALID_CURRENCY",
      400
    );
  }
  if (!isValidCode(to) || !rates.has(to)) {
    return errorResponse(
      `Invalid currency code: ${to}`,
      "INVALID_CURRENCY",
      400
    );
  }

  const fromRate = rates.get(from)!;
  const toRate = rates.get(to)!;

  // Calculate exchange rate
  // All rates are relative to USD, so:
  // X → USD: 1 / rate[X]
  // USD → X: rate[X]
  // X → Y: rate[Y] / rate[X]
  const rate = toRate.rate / fromRate.rate;

  // Use the most recent effective date
  const effectiveDate =
    fromRate.effectiveDate > toRate.effectiveDate
      ? fromRate.effectiveDate
      : toRate.effectiveDate;

  const response: RateResponse = {
    from,
    to,
    rate: Math.round(rate * 1000000) / 1000000, // 6 decimal precision
    effectiveDate,
  };

  return jsonResponse(response);
}

export function handleConvert(
  url: URL,
  rates: Map<string, ExchangeRateData>
): Response {
  const from = url.searchParams.get("from")?.toUpperCase();
  const to = url.searchParams.get("to")?.toUpperCase();
  const amountStr = url.searchParams.get("amount");

  // Validate required parameters
  if (!from || !to || !amountStr) {
    return errorResponse(
      "Missing required parameters: from, to, and amount",
      "MISSING_PARAMETER",
      400
    );
  }

  // Validate amount
  const amount = parseFloat(amountStr);
  if (isNaN(amount)) {
    return errorResponse(
      "Invalid amount: must be a number",
      "INVALID_AMOUNT",
      400
    );
  }

  // Validate currency codes
  if (!isValidCode(from) || !rates.has(from)) {
    return errorResponse(
      `Invalid currency code: ${from}`,
      "INVALID_CURRENCY",
      400
    );
  }
  if (!isValidCode(to) || !rates.has(to)) {
    return errorResponse(
      `Invalid currency code: ${to}`,
      "INVALID_CURRENCY",
      400
    );
  }

  const fromRate = rates.get(from)!;
  const toRate = rates.get(to)!;

  // Calculate exchange rate and converted amount
  const rate = toRate.rate / fromRate.rate;
  const convertedAmount = amount * rate;

  // Use the most recent effective date
  const effectiveDate =
    fromRate.effectiveDate > toRate.effectiveDate
      ? fromRate.effectiveDate
      : toRate.effectiveDate;

  const response: ConversionResponse = {
    from,
    to,
    amount,
    convertedAmount: Math.round(convertedAmount * 100) / 100, // 2 decimal precision
    rate: Math.round(rate * 1000000) / 1000000, // 6 decimal precision
    effectiveDate,
  };

  return jsonResponse(response);
}
