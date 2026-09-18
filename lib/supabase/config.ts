const envUrl=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const envKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const SUPABASE_URL = envUrl || 'https://qijltxhkukokgnhhxrlz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = envKey || 'sb_publishable_GzfdK5ZsjFosN3nObrIUXA_0c5minG9';

export function hasSupabaseConfig(){
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}
