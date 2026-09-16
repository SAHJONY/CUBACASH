// Test-only mock for '@/lib/supabase/admin'.
// The route modules call supabaseAdmin() per request; tests inject an
// in-memory fake via __mockState.db before each case.
export const __mockState = { db: null };

export function supabaseAdmin() {
  if (!__mockState.db) throw new Error('mock db not set — assign __mockState.db in the test');
  return __mockState.db;
}

// In-memory fake of the supabase-js query builder surface used by the
// Sofia routes: from().select()/update() chained with eq/order/limit and
// terminated by await / maybeSingle() / single().
export function makeDb(seedRows) {
  const rows = seedRows.map((r) => ({ ...r }));

  function exec(b) {
    let out = rows.filter((r) =>
      b._ops
        .filter((o) => o[0] === 'eq')
        .every(([, c, v]) => String(r[c]) === String(v))
    );
    const ord = b._ops.find((o) => o[0] === 'order');
    if (ord) {
      const [, c, o] = ord;
      const dir = o && o.ascending === false ? -1 : 1;
      out = [...out].sort((x, y) => (dir * (x[c] > y[c] ? 1 : x[c] < y[c] ? -1 : 0)));
    }
    const lim = b._ops.find((o) => o[0] === 'limit');
    if (lim) out = out.slice(0, lim[1]);
    if (b._update) out.forEach((r) => Object.assign(r, b._update));
    return out;
  }

  function chainable() {
    const b = {
      _ops: [],
      _update: null,
      select() { return b; },
      eq(c, v) { b._ops.push(['eq', c, v]); return b; },
      order(c, o) { b._ops.push(['order', c, o]); return b; },
      limit(n) { b._ops.push(['limit', n]); return b; },
      async maybeSingle() {
        const r = exec(b);
        return { data: r[0] ?? null, error: null };
      },
      async single() {
        const r = exec(b);
        return r.length ? { data: r[0], error: null } : { data: null, error: { message: 'no rows' } };
      },
      then(res, rej) {
        try { res({ data: exec(b), error: null }); } catch (e) { rej(e); }
      },
    };
    return b;
  }

  return {
    rows, // exposed for assertions
    from(table) {
      if (table !== 'sofia_order_intakes') throw new Error('unexpected table: ' + table);
      const b = chainable();
      return {
        select() { return b; },
        update(v) { b._update = v; return b; },
      };
    },
  };
}
