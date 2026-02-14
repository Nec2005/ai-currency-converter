import { parseCSV, ParsedRates } from "./csvParser";
import {
  handleHealthCheck,
  handleListCurrencies,
  handleGetRate,
  handleConvert,
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

    // Only handle GET requests
    if (request.method !== "GET") {
      return errorResponse("Method not allowed", "NOT_FOUND", 405);
    }

    const { rates } = getRates();

    switch (url.pathname) {
      case "/":
        return handleHealthCheck();

      case "/currencies":
        return handleListCurrencies(rates);

      case "/rate":
        return handleGetRate(url, rates);

      case "/convert":
        return handleConvert(url, rates);

      default:
        return errorResponse("Endpoint not found", "NOT_FOUND", 404);
    }
  },
} satisfies ExportedHandler<Env>;
