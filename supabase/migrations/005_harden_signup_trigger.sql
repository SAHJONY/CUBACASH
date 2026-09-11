-- Keep signup trigger callable by the trigger machinery, not as a public RPC.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
