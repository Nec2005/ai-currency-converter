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
