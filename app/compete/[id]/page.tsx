import { redirect } from 'next/navigation';

// Canonical competition routes live under /competitions/[id]/* (PRD). Redirect.
export default async function CompeteTerminalRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/competitions/${id}/round/1`);
}
