-- Internal sync helpers are trigger/system functions and must not be callable over the exposed API.
revoke all on function public.sync_delivery_capability_public_directory() from public, anon, authenticated;
revoke all on function public.sync_delivery_provider_public_directory() from public, anon, authenticated;
revoke all on function public.sync_platform_transaction_participants() from public, anon, authenticated;
