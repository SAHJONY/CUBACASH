// Test-only module hooks: resolve '@/lib/supabase/admin' to the in-memory
// mock and map any other '@/*' specifier to the repo tree.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const MOCK = pathToFileURL(path.join(ROOT, 'tests', 'sofia-supabase-mock.mjs')).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@/lib/supabase/admin') {
    return { url: MOCK, shortCircuit: true };
  }
  if (specifier.startsWith('@/')) {
    const p = path.join(ROOT, specifier.slice(2));
    for (const c of [p, p + '.ts', p + '.tsx', path.join(p, 'index.ts')]) {
      if (existsSync(c)) return { url: pathToFileURL(c).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
