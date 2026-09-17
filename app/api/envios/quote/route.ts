// SAHJONY Envíos quote intake.
// Public, unauthenticated intake: the page form posts here, the route
// validates, generates the ENV-2026-XXXXXX reference server-side, and
// persists to public.envios_quote_intakes (a logistics-only table,
// separate from every remittance/money-transfer table). The app never
// quotes prices itself — a real quote comes from Juan's team in 24–48h.
import { randomBytes } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

const CARGO_TYPES = ['CARRO', 'CONTENEDOR_FCL', 'PALLET_CONSOLIDADO'] as const;
const ORIGIN_MODES = ['PICKUP_HOUSTON', 'DROP_OFF'] as const;
const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars

function newReference() {
  const bytes = randomBytes(6);
  let suffix = '';
  for (const b of bytes) suffix += REF_ALPHABET[b % REF_ALPHABET.length];
  return `ENV-2026-${suffix}`;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'INVALID_JSON' }, 400);
  }
  if (!isObject(body)) return json({ error: 'INVALID_JSON' }, 400);

  const customerName = String(body.customerName ?? '').trim();
  const customerWhatsapp = String(body.customerWhatsapp ?? '').trim();
  const cargoType = String(body.cargoType ?? '').trim().toUpperCase();
  const originMode = String(body.originMode ?? '').trim().toUpperCase();
  const originDetail = body.originDetail ? String(body.originDetail).trim() : null;
  const destinationProvince = String(body.destinationProvince ?? '').trim();
  const destinationCity = String(body.destinationCity ?? '').trim();
  const locale = body.locale === 'en' ? 'en' : 'es';
  const notes = body.notes ? String(body.notes).slice(0, 2000) : null;
  const cargoDetails: unknown = body.cargoDetails ?? {};

  if (customerName.length < 2 || customerWhatsapp.length < 7) {
    return json({ error: 'CONTACT_INFORMATION_REQUIRED' }, 400);
  }
  if (!(CARGO_TYPES as readonly string[]).includes(cargoType)) {
    return json({ error: 'INVALID_CARGO_TYPE' }, 400);
  }
  if (!(ORIGIN_MODES as readonly string[]).includes(originMode)) {
    return json({ error: 'INVALID_ORIGIN_MODE' }, 400);
  }
  if (!destinationProvince || !destinationCity) {
    return json({ error: 'DESTINATION_REQUIRED' }, 400);
  }
  if (!isObject(cargoDetails)) return json({ error: 'INVALID_CARGO_DETAILS' }, 400);

  // Type-specific required fields. No prices, rates, times or carriers are
  // accepted here — the real quote comes from the broker team in 24–48h.
  if (cargoType === 'CARRO') {
    const year = Number(cargoDetails.year);
    if (!String(cargoDetails.make ?? '').trim() || !String(cargoDetails.model ?? '').trim() || !Number.isInteger(year) || year < 1900 || year > 2027) {
      return json({ error: 'CAR_DETAILS_REQUIRED' }, 400);
    }
  } else if (cargoType === 'CONTENEDOR_FCL') {
    if (!['20', '40'].includes(String(cargoDetails.containerSize ?? '')) || !String(cargoDetails.goodsDescription ?? '').trim()) {
      return json({ error: 'CONTAINER_DETAILS_REQUIRED' }, 400);
    }
  } else {
    const pieces = Number(cargoDetails.pieces);
    if (!Number.isInteger(pieces) || pieces < 1 || !String(cargoDetails.goodsDescription ?? '').trim()) {
      return json({ error: 'PALLET_DETAILS_REQUIRED' }, 400);
    }
  }

  const db = supabaseAdmin();

  // Insert with server-generated reference; retry on the (very unlikely)
  // unique conflict so every lead gets a distinct ENV-2026-XXXXXX.
  let inserted: { id: string; reference: string } | null = null;
  for (let attempt = 0; attempt < 6 && !inserted; attempt += 1) {
    const reference = newReference();
    const { data, error } = await db
      .from('envios_quote_intakes')
      .insert({
        reference,
        customer_name: customerName,
        customer_whatsapp: customerWhatsapp,
        cargo_type: cargoType,
        origin_mode: originMode,
        origin_detail: originDetail,
        destination_province: destinationProvince,
        destination_city: destinationCity,
        cargo_details: cargoDetails,
        notes,
        status: 'PENDING_QUOTE',
        locale,
      })
      .select('id,reference')
      .single();
    if (error) {
      if ((error as { code?: string }).code === '23505') continue; // reference collision: retry
      return json({ error: 'ENVIOS_INTAKE_FAILED' }, 500);
    }
    inserted = data as { id: string; reference: string };
  }
  if (!inserted) return json({ error: 'ENVIOS_INTAKE_FAILED' }, 500);

  return json(
    {
      intake: { id: inserted.id, reference: inserted.reference, status: 'PENDING_QUOTE' },
      reference: inserted.reference,
      quotePromise: 'QUOTE_WITHIN_24_48H',
      // This request creates only the quote REQUEST. Prices, quotes and
      // bookings are produced by Juan's broker team, never by the app.
      commitmentRule: 'REQUEST_ONLY_NO_PRICE_QUOTED_NO_BOOKING_MADE',
    },
    201
  );
}
