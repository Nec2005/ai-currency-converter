export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRateData {
  code: string;
  name: string;
  rate: number;
  effectiveDate: string;
}

export interface RateResponse {
  from: string;
  to: string;
  rate: number;
  effectiveDate: string;
}

export interface ConversionResponse {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  effectiveDate: string;
  totalCurrencies: number;
}

export interface ApiError {
  error: string;
  code: "INVALID_CURRENCY" | "MISSING_PARAMETER" | "INVALID_AMOUNT" | "NOT_FOUND";
}

export interface CurrenciesResponse {
  currencies: Currency[];
}

export interface HealthResponse {
  status: string;
  message: string;
}

// New endpoint types

export interface RatesResponse {
  base: string;
  effectiveDate: string;
  rates: Record<string, number>;
}

export interface CurrencyDetailResponse {
  code: string;
  name: string;
  rateToUSD: number;
  effectiveDate: string;
}

export interface BatchConversionRequest {
  from: string;
  to: string;
  amounts: number[];
}

export interface BatchConversionResponse {
  from: string;
  to: string;
  rate: number;
  effectiveDate: string;
  conversions: {
    amount: number;
    convertedAmount: number;
  }[];
}
