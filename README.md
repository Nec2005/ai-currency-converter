# Currency Converter API

[![Tests](https://github.com/Nec2005/ai-currency-converter/actions/workflows/test.yml/badge.svg)](https://github.com/Nec2005/ai-currency-converter/actions/workflows/test.yml)

A REST API for currency conversion built with TypeScript and Cloudflare Workers.

## Local Development

### Prerequisites

- Node.js (v18+)
- npm

### Setup

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

The API will be available at `http://localhost:8787`

## API Endpoints

### Health Check
```
GET http://localhost:8787/
```

### List All Currencies
```
GET http://localhost:8787/currencies
```

### Get Currency Details
```
GET http://localhost:8787/currencies/EUR
```

### Get Exchange Rate
```
GET http://localhost:8787/rate?from=USD&to=EUR
```

### Get All Rates (relative to base)
```
GET http://localhost:8787/rates?base=USD
```

### Convert Currency
```
GET http://localhost:8787/convert?from=USD&to=EUR&amount=100
```

### Batch Convert (POST)
```bash
curl -X POST http://localhost:8787/convert/batch \
  -H "Content-Type: application/json" \
  -d '{"from": "USD", "to": "EUR", "amounts": [100, 250, 500]}'
```

## Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

```bash
npm run deploy
```
