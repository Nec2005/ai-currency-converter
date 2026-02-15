import { parseCSV, ParsedRates } from "./csvParser";
import {
  handleHealthCheck,
  handleListCurrencies,
  handleGetRate,
  handleConvert,
  handleGetAllRates,
  handleGetCurrencyDetail,
  handleBatchConvert,
  errorResponse,
} from "./handlers";
import csvData from "../data/exchange_rates_with_iso.csv";

// Cache parsed rates
let cachedRates: ParsedRates | null = null;

function getRates(): ParsedRates {
  if (!cachedRates) {
    cachedRates = parseCSV(csvData);
  }
  return cachedRates;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const { rates } = getRates();

    // Handle POST requests
    if (request.method === "POST") {
      if (url.pathname === "/convert/batch") {
        return handleBatchConvert(request, rates);
      }
      return errorResponse("Method not allowed", "NOT_FOUND", 405);
    }

    // Handle GET requests
    if (request.method !== "GET") {
      return errorResponse("Method not allowed", "NOT_FOUND", 405);
    }

    // Check for /currencies/{code} pattern
    const currencyMatch = url.pathname.match(/^\/currencies\/([A-Za-z]{3})$/);
    if (currencyMatch) {
      return handleGetCurrencyDetail(currencyMatch[1], rates);
    }

    switch (url.pathname) {
      case "/":
        return handleHealthCheck();

      case "/currencies":
        return handleListCurrencies(rates);

      case "/rates":
        return handleGetAllRates(url, rates);

      case "/rate":
        return handleGetRate(url, rates);

      case "/convert":
        return handleConvert(url, rates);

      default:
        return errorResponse("Endpoint not found", "NOT_FOUND", 404);
    }
  },
} satisfies ExportedHandler<Env>;
