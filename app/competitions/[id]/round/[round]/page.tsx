import { redirect } from 'next/navigation';

export default async function RoundRedirect({ params }: { params: Promise<{ id: string; round: string }> }) {
  const { id } = await params;
  redirect(`/compete/${id}`);
}
