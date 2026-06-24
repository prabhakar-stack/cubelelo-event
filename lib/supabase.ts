import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client (service role — never expose to the browser).
 * Returns null when env isn't configured so callers can degrade gracefully
 * while the app still runs on MongoDB (pre-Phase-2).
 */
export const supabaseAdmin: SupabaseClient | null =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;
