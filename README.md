# SAHJONY CUBACASH

**SAHJONY CUBACASH** is a standalone, multilingual full-stack platform for the private-sector economy: private businesses, entrepreneurs, cooperatives, buyers, suppliers, service providers and approved international counterparties.

## Product scope

CUBACASH is designed as a business operating platform rather than a bank. The initial platform includes:

- Private-sector business profiles and KYB status
- Buyer / supplier marketplace
- RFQs and trade opportunities
- Domestic and cross-border corridor classification
- Transaction and settlement-intent ledger (non-custodial)
- Compliance decisioning with fail-closed sanctions controls
- Beneficial-owner and counterparty verification states
- Audit trail and evidence references
- Multilingual interface: Spanish, English, French, Portuguese and Arabic/RTL
- API-first architecture for future mobile, WhatsApp, Telegram and partner integrations

## Corridor model

- `CU-CU` — private commerce within Cuba
- `CU-WORLD` — private-sector exports from Cuba
- `WORLD-CU` — imports and sourcing for Cuban private businesses
- `CU-US` — transactions involving the United States or U.S. nexus; special review required
- `WORLD-WORLD` — international private-sector transactions outside Cuba

## Compliance model

CUBACASH is designed to fail closed:

- `SANCTIONS_BLOCKED` -> `BLOCK`
- `SANCTIONS_PENDING | REVIEW | ERROR` -> `HOLD`
- Missing required KYC/KYB or beneficial ownership -> `HOLD`
- Fraud or structuring indicators -> `HOLD`
- U.S.-nexus transaction without product/control review -> `HOLD`

A stable legitimate family-remittance pattern may reduce anomaly weighting only. It never bypasses sanctions, KYC/KYB, fraud, structuring, export controls, or mandatory review.

## Stack

- Next.js 16 / React 19 / TypeScript
- Supabase Auth + Postgres + Row Level Security
- Server Components + Route Handlers
- Vercel-ready deployment
- GitHub Actions CI

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Architecture

```text
Browser / Mobile / Messaging Channels
              |
              v
       Next.js Application
              |
   +----------+-----------+
   |                      |
 Auth / RBAC           API Layer
   |                      |
   +----------+-----------+
              |
              v
       Supabase Postgres
              |
  Marketplace / RFQ / Ledger
  Compliance / Audit / KYB
```

## Production gates

Do not treat CUBACASH as a regulated financial institution or live sanctions service until the required providers, licenses, legal reviews, banking/payment partners and production controls are in place. Transaction eligibility must be evaluated per jurisdiction and corridor.
