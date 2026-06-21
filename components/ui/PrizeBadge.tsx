import { Trophy } from 'lucide-react';
import { formatPrice } from '@/lib/utils/competition';

/** Prize-pool badge. Renders nothing when there's no pool. `paise` is the total in paise. */
export default function PrizeBadge({ paise, className = '' }: { paise?: number; className?: string }) {
  if (!paise || paise <= 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-amber-400 ${className}`}>
      <Trophy size={11} />
      <span className="font-medium">{formatPrice(paise)}</span>
    </span>
  );
}
