// Tests for the SAHJONY Envíos quote intake:
//   POST /api/envios/quote
// Run: node --import ./tests/hooks-register.mjs --test tests/envios-quote.test.mjs
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { __mockState } from './sofia-supabase-mock.mjs';
import { POST } from '../app/api/envios/quote/route.ts';

// In-memory fake of the supabase-js surface used by the envios route:
// from(table).insert(row).select('id,reference').single()
// and .select('id').eq('reference', ref).maybeSingle() (unused but present).
function makeEnviosDb(seedRows, { failInsert = 0 } = {}) {
  const rows = seedRows.map((r) => ({ ...r }));
  let inserts = 0;
  return {
    rows,
    from(table) {
      assert.equal(table, 'envios_quote_intakes', 'unexpected table');
      return {
        insert(payload) {
          inserts += 1;
          return {
            select() {
              return {
                async single() {
                  if (inserts <= failInsert) return { data: null, error: { code: '23505', message: 'duplicate' } };
                  const row = { id: `id-${inserts}`, ...payload };
                  rows.push(row);
                  return { data: { id: row.id, reference: row.reference }, error: null };
                },
              };
            },
          };
        },
        select() {
          return {
            eq(col, val) {
              return {
                async maybeSingle() {
                  const found = rows.find((r) => String(r[col]) === String(val));
                  return { data: found ?? null, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
}

function postReq(payload) {
  return new Request('http://localhost/api/envios/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

const CAR = {
  customerName: 'Juan Perez',
  customerWhatsapp: '+12815550100',
  cargoType: 'CARRO',
  originMode: 'PICKUP_HOUSTON',
  originDetail: '123 Main St, Houston TX',
  destinationProvince: 'La Habana',
  destinationCity: 'Vedado',
  cargoDetails: { year: 2021, make: 'Toyota', model: 'Corolla', vin: '', running: 'SI' },
  notes: 'llamar en la tarde',
};

beforeEach(() => {
  __mockState.db = makeEnviosDb([]);
});

test('persists a car quote request and returns an ENV-2026-XXXXXX reference', async () => {
  const res = await POST(postReq(CAR));
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.match(body.reference, /^ENV-2026-[A-Z0-9]{6}$/);
  assert.equal(body.intake.status, 'PENDING_QUOTE');
  assert.equal(body.quotePromise, 'QUOTE_WITHIN_24_48H');
  const stored = __mockState.db.rows[0];
  assert.equal(stored.reference, body.reference);
  assert.equal(stored.customer_name, 'Juan Perez');
  assert.equal(stored.cargo_type, 'CARRO');
  assert.equal(stored.status, 'PENDING_QUOTE');
  assert.deepEqual(stored.cargo_details, CAR.cargoDetails);
});

test('accepts container and pallet cargo types with their required fields', async () => {
  const container = {
    ...CAR, cargoType: 'CONTENEDOR_FCL',
    cargoDetails: { containerSize: '40', goodsDescription: 'alimentos' },
  };
  const pallet = {
    ...CAR, cargoType: 'PALLET_CONSOLIDADO', originMode: 'DROP_OFF',
    cargoDetails: { pieces: 12, weight: '500', dimensions: '48x40x60', goodsDescription: 'ropa' },
  };
  for (const p of [container, pallet]) {
    const res = await POST(postReq(p));
    assert.equal(res.status, 201);
    assert.match((await res.json()).reference, /^ENV-2026-[A-Z0-9]{6}$/);
  }
  assert.equal(__mockState.db.rows.length, 2);
});

test('rejects missing contact info, destination, or type-specific details', async () => {
  const missingName = await POST(postReq({ ...CAR, customerName: 'A' }));
  assert.equal(missingName.status, 400);
  const noCity = await POST(postReq({ ...CAR, destinationCity: '' }));
  assert.equal(noCity.status, 400);
  const badCar = await POST(postReq({ ...CAR, cargoDetails: { year: 2021, make: '', model: 'Corolla' } }));
  assert.equal(badCar.status, 400);
  const badCargo = await POST(postReq({ ...CAR, cargoType: 'BARCO' }));
  assert.equal(badCargo.status, 400);
  const badOrigin = await POST(postReq({ ...CAR, originMode: 'TELEPORT' }));
  assert.equal(badOrigin.status, 400);
  assert.equal(__mockState.db.rows.length, 0);
});

test('retries the reference on a unique conflict and still succeeds', async () => {
  __mockState.db = makeEnviosDb([], { failInsert: 2 });
  const res = await POST(postReq(CAR));
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.match(body.reference, /^ENV-2026-[A-Z0-9]{6}$/);
  assert.equal(__mockState.db.rows.length, 1);
});
