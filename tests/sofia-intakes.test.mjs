// Tests for the Sofia read/update routes:
//   GET   /api/sofia/intakes?sender_phone=<e164>
//   PATCH /api/sofia/intakes/[id]
// Run: npm test   (node --import ./tests/hooks-register.mjs --test tests/)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { __mockState, makeDb } from './sofia-supabase-mock.mjs';
import { GET } from '../app/api/sofia/intakes/route.ts';
import { PATCH } from '../app/api/sofia/intakes/[id]/route.ts';

const SECRET = 'test-sofia-ingest-secret';
const SENDER = '+13055550100';
const OTHER = '+13055550999';

function seed() {
  return [
    {
      id: 'intake-old', sender_phone: SENDER, intake_status: 'COLLECTING',
      channel: 'WHATSAPP', request_type: 'FAMILY_REMITTANCE',
      requested_amount: 100, requested_currency: 'USD',
      payment_status: 'NOT_VERIFIED', payment_evidence: { selfie: 'blob-ref' },
      remittance_intent_id: 'ri_111', notes: 'first',
      created_at: '2026-09-16T10:00:00.000Z', updated_at: '2026-09-16T10:00:00.000Z',
    },
    {
      id: 'intake-new', sender_phone: SENDER, intake_status: 'READY_FOR_REVIEW',
      channel: 'WHATSAPP', request_type: 'BUSINESS_REMITTANCE',
      requested_amount: 250, requested_currency: 'USD',
      payment_status: 'AWAITING_PAYMENT', payment_evidence: { receipt: 'blob-ref' },
      remittance_intent_id: 'ri_222', notes: null,
      created_at: '2026-09-16T11:00:00.000Z', updated_at: '2026-09-16T11:00:00.000Z',
    },
    {
      id: 'intake-other', sender_phone: OTHER, intake_status: 'COLLECTING',
      channel: 'WHATSAPP', request_type: 'FAMILY_REMITTANCE',
      requested_amount: 50, requested_currency: 'USD',
      payment_status: 'NOT_VERIFIED', payment_evidence: {},
      remittance_intent_id: null, notes: null,
      created_at: '2026-09-16T12:00:00.000Z', updated_at: '2026-09-16T12:00:00.000Z',
    },
  ];
}

beforeEach(() => {
  process.env.SOFIA_INGEST_SECRET = SECRET;
  __mockState.db = makeDb(seed());
});

function getReq(phone, secret = SECRET) {
  const url = `http://localhost/api/sofia/intakes${phone === null ? '' : `?sender_phone=${encodeURIComponent(phone)}`}`;
  return new Request(url, { headers: { 'x-sofia-ingest-secret': secret } });
}

function patchReq(id, body, secret = SECRET) {
  return new Request(`http://localhost/api/sofia/intakes/${id}`, {
    method: 'PATCH',
    headers: { 'x-sofia-ingest-secret': secret, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ctx = (id) => ({ params: Promise.resolve({ id }) });

// ---------- GET ----------

test('GET returns only the sender phone intakes, newest first', async () => {
  const res = await GET(getReq(SENDER));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.intakes.length, 2);
  assert.deepEqual(body.intakes.map((i) => i.id), ['intake-new', 'intake-old']);
});

test('GET never exposes payment_evidence (or other money/identity internals)', async () => {
  const res = await GET(getReq(SENDER));
  const body = await res.json();
  for (const intake of body.intakes) {
    assert.ok(!('payment_evidence' in intake), 'payment_evidence leaked');
    assert.ok(!('payment_status' in intake), 'payment_status leaked');
    assert.ok(!('remittance_intent_id' in intake), 'remittance_intent_id leaked');
  }
  const allowed = new Set(['id', 'channel', 'intake_status', 'request_type', 'requested_amount',
    'requested_currency', 'sender_phone', 'notes', 'created_at', 'updated_at']);
  for (const intake of body.intakes) {
    for (const k of Object.keys(intake)) assert.ok(allowed.has(k), `unexpected field ${k}`);
  }
});

test('GET rejects a wrong secret', async () => {
  const res = await GET(getReq(SENDER, 'wrong-secret'));
  assert.equal(res.status, 401);
});

test('GET rejects a missing secret header', async () => {
  const res = await GET(new Request(`http://localhost/api/sofia/intakes?sender_phone=${encodeURIComponent(SENDER)}`));
  assert.equal(res.status, 401);
});

test('GET requires sender_phone', async () => {
  const res = await GET(getReq(null));
  assert.equal(res.status, 400);
  const res2 = await GET(getReq('+123'));
  assert.equal(res2.status, 400);
});

// ---------- PATCH ----------

test('PATCH happy path: updates notes and intake_status', async () => {
  const res = await PATCH(patchReq('intake-old', { notes: 'called customer', intake_status: 'on_hold' }), ctx('intake-old'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.intake.id, 'intake-old');
  assert.equal(body.intake.intake_status, 'ON_HOLD');
  assert.equal(body.intake.notes, 'called customer');
  assert.ok(body.intake.updated_at);
  const row = __mockState.db.rows.find((r) => r.id === 'intake-old');
  assert.equal(row.intake_status, 'ON_HOLD');
  assert.equal(row.notes, 'called customer');
  // money state untouched
  assert.equal(row.payment_status, 'NOT_VERIFIED');
  assert.equal(row.requested_amount, 100);
});

test('PATCH accepts each allowed status', async () => {
  for (const s of ['COLLECTING', 'READY_FOR_REVIEW', 'ON_HOLD', 'CANCELLED']) {
    const res = await PATCH(patchReq('intake-old', { intake_status: s }), ctx('intake-old'));
    assert.equal(res.status, 200, s);
    assert.equal((await res.json()).intake.intake_status, s);
  }
});

test('PATCH rejects CONVERTED status (not in the Sofia allowlist)', async () => {
  const res = await PATCH(patchReq('intake-old', { intake_status: 'CONVERTED' }), ctx('intake-old'));
  assert.equal(res.status, 422);
});

test('PATCH hard-blocks payment_status', async () => {
  const res = await PATCH(patchReq('intake-old', { notes: 'x', payment_status: 'VERIFIED' }), ctx('intake-old'));
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.error, 'FIELD_NOT_UPDATABLE_BY_SOFIA');
  assert.ok(body.fields.includes('payment_status'));
  // nothing was written
  const row = __mockState.db.rows.find((r) => r.id === 'intake-old');
  assert.equal(row.payment_status, 'NOT_VERIFIED');
  assert.equal(row.notes, 'first');
});

test('PATCH hard-blocks requested_amount, payment_evidence, remittance_intent_id', async () => {
  for (const field of ['requested_amount', 'payment_evidence', 'remittance_intent_id']) {
    const res = await PATCH(patchReq('intake-old', { [field]: 'tampered' }), ctx('intake-old'));
    assert.equal(res.status, 422, field);
    assert.ok((await res.json()).fields.includes(field));
  }
  const row = __mockState.db.rows.find((r) => r.id === 'intake-old');
  assert.equal(row.requested_amount, 100);
  assert.deepEqual(row.payment_evidence, { selfie: 'blob-ref' });
  assert.equal(row.remittance_intent_id, 'ri_111');
});

test('PATCH rejects unknown fields', async () => {
  const res = await PATCH(patchReq('intake-old', { sender_phone: '+1999' }), ctx('intake-old'));
  assert.equal(res.status, 422);
});

test('PATCH rejects a wrong secret and writes nothing', async () => {
  const res = await PATCH(patchReq('intake-old', { notes: 'x' }, 'wrong-secret'), ctx('intake-old'));
  assert.equal(res.status, 401);
  assert.equal(__mockState.db.rows.find((r) => r.id === 'intake-old').notes, 'first');
});

test('PATCH returns 404 for an unknown intake', async () => {
  const res = await PATCH(patchReq('nope', { notes: 'x' }), ctx('nope'));
  assert.equal(res.status, 404);
});

test('PATCH rejects an empty body', async () => {
  const res = await PATCH(patchReq('intake-old', {}), ctx('intake-old'));
  assert.equal(res.status, 400);
});
