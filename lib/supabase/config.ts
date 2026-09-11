export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://yuhwtkbjdttqloxqeybm.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_2ihwwLzH2OgWIMqmcIV8xg_Uasg_uhG';

export function hasSupabaseConfig(){
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}
