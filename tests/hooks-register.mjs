// Registered via `node --import` so the hooks apply before any test import.
import { register } from 'node:module';
register('./sofia-hooks.mjs', import.meta.url);
