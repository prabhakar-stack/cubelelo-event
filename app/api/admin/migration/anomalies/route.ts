/**
 * GET   /api/admin/migration/anomalies?resolved=false  — list migration anomalies
 * PATCH /api/admin/migration/anomalies  { id, resolved }  — mark resolved/unresolved
 *
 * Reads the Supabase migration_anomalies table (zero-data-loss log).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  if (!supabaseAdmin) return NextResponse.json({ anomalies: [], counts: { total: 0, unresolved: 0 }, configured: false });

  const resolved = new URL(req.url).searchParams.get('resolved');
  let q = supabaseAdmin.from('migration_anomalies').select('*').order('created_at', { ascending: false }).limit(500);
  if (resolved === 'true' || resolved === 'false') q = q.eq('resolved', resolved === 'true');

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count: total } = await supabaseAdmin.from('migration_anomalies').select('*', { count: 'exact', head: true });
  const { count: unresolved } = await supabaseAdmin.from('migration_anomalies').select('*', { count: 'exact', head: true }).eq('resolved', false);

  return NextResponse.json({ anomalies: data ?? [], counts: { total: total ?? 0, unresolved: unresolved ?? 0 }, configured: true });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { id, resolved } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('migration_anomalies')
    .update({ resolved: !!resolved, resolved_by: auth.session.user?.email ?? null, resolved_at: resolved ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
