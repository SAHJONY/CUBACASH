import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL as CONFIG_URL } from './config';

// Server-side admin client. Prefers the runtime SUPABASE_URL (read live from
// the server environment) because NEXT_PUBLIC_* values are baked in at build
// time and go stale when the build runs without env. Falls back to the
// shared config URL only if no runtime URL is set.
function adminUrl(){
  const runtime = process.env.SUPABASE_URL?.trim();
  return runtime || CONFIG_URL;
}

export function supabaseAdmin(){
  const url = adminUrl();
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url) throw new Error('SUPABASE_URL is not configured');
  if(!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
