# Nexar API – Product search (Octopart/Supply)

Product search uses **only** the [Nexar API](https://support.nexar.com/support/solutions/101000253221/) (Octopart/Supply). Other scrapers have been removed.

## Credentials

1. Copy `.env.example` to `.env`.
2. Set in `.env`:
   - **Option A:** `NEXAR_CLIENT_ID` and `NEXAR_CLIENT_SECRET` (from Nexar portal → Apps → your app → Authorization). Token is refreshed automatically (24h).
   - **Option B:** `NEXAR_ACCESS_TOKEN` (pre-generated token, valid 24h).

`.env` is gitignored; do not commit it.

## Commands

```bash
# Search by part number or keyword (saves to knowledge-base/nexar/)
npm run search -- LM358
npm run search -- 205203-3 10

# Search and run Ollama extraction on results
npm run search:ollama -- LM358

# Same as search (scrape:multi now uses Nexar only)
npm run scrape:multi -- LM358
```

## Output

- **knowledge-base/nexar/** – `<PART>_nexar.json` (Nexar part list: id, mpn, name, manufacturer, totalAvail, category).
- **knowledge-base/ollama-extractions/** – `<PART>_FINAL.json` (only when using `npm run search:ollama`).

## API details

- **Token:** `POST https://identity.nexar.com/connect/token` (grant_type=client_credentials, scope=supply.domain).
- **GraphQL:** `POST https://api.nexar.com/graphql` with `Authorization: Bearer <token>`.
- **Query:** `supSearch(q: String!, limit: Int)` – returns part id, mpn, name, shortDescription, manufacturer, totalAvail, category.

Documentation: https://support.nexar.com/support/solutions/101000253221/

**Note:** If you see "part limit of 0", your Nexar plan has no part quota. Subscribe to a plan or contact api@nexar.com.
