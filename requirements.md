# Currency Converter API - Product Requirements Document

## Overview

A REST API service that converts currency amounts between different currencies using exchange rates sourced from a CSV dataset. The API is built with TypeScript and deployed on Cloudflare Workers.

## Data Source

The exchange rates are stored in `data/exchange_rates_with_iso.csv` with the following structure:

| Column | Description |
|--------|-------------|
| Record Date | Date when the rate was recorded |
| Country - Currency Description | Country and currency name (e.g., "Afghanistan-Afghani") |
| Exchange Rate | Rate relative to USD |
| Effective Date | Date when the rate becomes effective |

## API Endpoints

### 1. Health Check

**GET /**

Returns API status.

**Response:**
```json
{
  "status": "ok",
  "message": "Currency Converter API"
}
```

### 2. List Supported Currencies

**GET /currencies**

Returns all supported currencies.

**Response:**
```json
{
  "currencies": [
    {
      "code": "AFN",
      "name": "Afghanistan-Afghani"
    },
    {
      "code": "ALL",
      "name": "Albania-Lek"
    }
  ]
}
```

### 3. Get Exchange Rate

**GET /rate?from={currency}&to={currency}**

Returns the exchange rate between two currencies.

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| from | Yes | Source currency code (e.g., USD) |
| to | Yes | Target currency code (e.g., EUR) |

**Response:**
```json
{
  "from": "USD",
  "to": "EUR",
  "rate": 0.92,
  "effectiveDate": "2025-12-31"
}
```

### 4. Convert Currency

**GET /convert?from={currency}&to={currency}&amount={number}**

Converts an amount from one currency to another.

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| from | Yes | Source currency code |
| to | Yes | Target currency code |
| amount | Yes | Amount to convert |

**Response:**
```json
{
  "from": "USD",
  "to": "EUR",
  "amount": 100,
  "convertedAmount": 92.00,
  "rate": 0.92,
  "effectiveDate": "2025-12-31"
}
```

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_CURRENCY | 400 | Currency code not supported |
| MISSING_PARAMETER | 400 | Required parameter missing |
| INVALID_AMOUNT | 400 | Amount is not a valid number |
| NOT_FOUND | 404 | Endpoint not found |

## Technical Requirements

### Performance
- Response time < 100ms for all endpoints
- Support for concurrent requests

### Data Loading
- CSV data loaded at worker initialization
- Exchange rates cached in memory

### Deployment
- Cloudflare Workers for production
- Local development via Wrangler CLI

### 5. Get All Rates

**GET /rates?base={currency}**

Returns all exchange rates relative to a base currency (defaults to USD).

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| base | No | Base currency code (default: USD) |

**Response:**
```json
{
  "base": "USD",
  "effectiveDate": "2025-12-31",
  "rates": {
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 157.5
  }
}
```

### 6. Get Currency Detail

**GET /currencies/{code}**

Returns details for a specific currency.

**Response:**
```json
{
  "code": "EUR",
  "name": "Euro Zone-Euro",
  "rateToUSD": 0.851,
  "effectiveDate": "2025-12-31"
}
```

### 7. Batch Convert

**POST /convert/batch**

Converts multiple amounts in a single request.

**Request Body:**
```json
{
  "from": "USD",
  "to": "EUR",
  "amounts": [100, 250, 500]
}
```

**Response:**
```json
{
  "from": "USD",
  "to": "EUR",
  "rate": 0.92,
  "effectiveDate": "2025-12-31",
  "conversions": [
    { "amount": 100, "convertedAmount": 92.00 },
    { "amount": 250, "convertedAmount": 230.00 },
    { "amount": 500, "convertedAmount": 460.00 }
  ]
}
```

## Future Enhancements

1. **Historical Rates** - Query rates for specific dates
2. **Rate Change Notifications** - Webhook support for rate changes
3. **Currency Metadata** - Additional info like symbols, decimal places
