import { redirect } from 'next/navigation';

export default async function LobbyRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/compete/${id}/lobby`);
}
