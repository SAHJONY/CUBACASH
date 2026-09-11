# mycubacash.com

**mycubacash.com** is the standalone, multilingual full-stack platform for the private-sector economy: private businesses, entrepreneurs, cooperatives, buyers, suppliers, service providers and approved international counterparties.

**Application name:** `mycubacash.com`  
**Primary domain:** `https://mycubacash.com`  
**Technical repository:** `SAHJONY/CUBACASH`

## Product scope

mycubacash.com is a private-sector business operating platform. The initial platform includes:

- Private-sector business profiles and KYB status
- Buyer / supplier marketplace
- RFQs and trade opportunities
- Domestic and cross-border corridor classification
- Private-sector transaction and settlement-intent ledger
- Compliance policy orchestration with fail-closed sanctions controls
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

## Policy and orchestration model

mycubacash.com uses this framework as its private-sector policy and orchestration layer:

- `SANCTIONS_BLOCKED` -> `BLOCK`
- `SANCTIONS_PENDING | REVIEW | ERROR` -> `HOLD`
- Missing required KYC/KYB or beneficial ownership -> `HOLD`
- Fraud or structuring indicators -> `HOLD`
- U.S.-nexus transaction without product/control review -> `HOLD`

A stable legitimate family-remittance pattern may reduce anomaly weighting only. It never bypasses sanctions, KYC/KYB, fraud, structuring, export controls, or mandatory review.

Sanctions data, jurisdiction-specific legal obligations, regulatory interpretations, and filing decisions must remain tied to authoritative current sources and appropriately authorized compliance/legal personnel. The application orchestrates policy, evidence, workflow, controls, and decision state; it does not substitute stale or inferred legal data for authoritative current determinations.

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
NEXT_PUBLIC_SITE_URL=https://mycubacash.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Architecture

```text
Browser / Mobile / Messaging Channels
              |
              v
      mycubacash.com
              |
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
  Policy / Compliance / Audit / KYB
```

## Private-sector operating policy

The platform is scoped to the private-sector economy. Policy execution is automated where appropriate, while sanctions data, jurisdiction-specific legal obligations, regulatory interpretations, and filing decisions are sourced from authoritative current sources and remain subject to appropriately authorized compliance/legal review when required.
