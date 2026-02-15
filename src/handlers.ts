import {
  ApiError,
  CurrenciesResponse,
  ConversionResponse,
  HealthResponse,
  RateResponse,
  ExchangeRateData,
  RatesResponse,
  CurrencyDetailResponse,
  BatchConversionResponse,
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

export function handleGetAllRates(
  url: URL,
  rates: Map<string, ExchangeRateData>
): Response {
  const base = url.searchParams.get("base")?.toUpperCase() || "USD";

  // Validate base currency
  if (!isValidCode(base) || !rates.has(base)) {
    return errorResponse(
      `Invalid base currency code: ${base}`,
      "INVALID_CURRENCY",
      400
    );
  }

  const baseRate = rates.get(base)!;
  const allRates: Record<string, number> = {};
  let latestDate = baseRate.effectiveDate;

  for (const [code, data] of rates) {
    // Calculate rate relative to base currency
    const rate = data.rate / baseRate.rate;
    allRates[code] = Math.round(rate * 1000000) / 1000000;

    if (data.effectiveDate > latestDate) {
      latestDate = data.effectiveDate;
    }
  }

  const response: RatesResponse = {
    base,
    effectiveDate: latestDate,
    rates: allRates,
  };

  return jsonResponse(response);
}

export function handleGetCurrencyDetail(
  code: string,
  rates: Map<string, ExchangeRateData>
): Response {
  const upperCode = code.toUpperCase();

  if (!isValidCode(upperCode) || !rates.has(upperCode)) {
    return errorResponse(
      `Invalid currency code: ${upperCode}`,
      "INVALID_CURRENCY",
      400
    );
  }

  const data = rates.get(upperCode)!;

  const response: CurrencyDetailResponse = {
    code: data.code,
    name: data.name,
    rateToUSD: data.rate,
    effectiveDate: data.effectiveDate,
  };

  return jsonResponse(response);
}

export async function handleBatchConvert(
  request: Request,
  rates: Map<string, ExchangeRateData>
): Promise<Response> {
  // Parse JSON body
  let body: { from?: string; to?: string; amounts?: number[] };
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "Invalid JSON body",
      "MISSING_PARAMETER",
      400
    );
  }

  const from = body.from?.toUpperCase();
  const to = body.to?.toUpperCase();
  const amounts = body.amounts;

  // Validate required parameters
  if (!from || !to || !amounts) {
    return errorResponse(
      "Missing required parameters: from, to, and amounts",
      "MISSING_PARAMETER",
      400
    );
  }

  // Validate amounts is an array
  if (!Array.isArray(amounts) || amounts.length === 0) {
    return errorResponse(
      "amounts must be a non-empty array of numbers",
      "INVALID_AMOUNT",
      400
    );
  }

  // Validate all amounts are numbers
  for (const amt of amounts) {
    if (typeof amt !== "number" || isNaN(amt)) {
      return errorResponse(
        "All amounts must be valid numbers",
        "INVALID_AMOUNT",
        400
      );
    }
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
  const rate = toRate.rate / fromRate.rate;

  const effectiveDate =
    fromRate.effectiveDate > toRate.effectiveDate
      ? fromRate.effectiveDate
      : toRate.effectiveDate;

  const conversions = amounts.map((amount) => ({
    amount,
    convertedAmount: Math.round(amount * rate * 100) / 100,
  }));

  const response: BatchConversionResponse = {
    from,
    to,
    rate: Math.round(rate * 1000000) / 1000000,
    effectiveDate,
    conversions,
  };

  return jsonResponse(response);
}
