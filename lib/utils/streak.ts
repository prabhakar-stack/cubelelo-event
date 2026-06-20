/**
 * Daily-challenge streak computation.
 *
 * Keyed on the user's CL ID (`userId`) so the value is consistent across the
 * daily-challenge routes and public profiles. Uses two bulk queries (challenges
 * + this user's entries) instead of one query per day — no N+1.
 */
import { DailyChallenge, DailyChallengeEntry } from '@/lib/models/DailyChallenge';

function todayIST(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

/** Consecutive-day streak ending today (IST). 0 if today isn't yet completed. */
export async function computeDailyStreak(userId: string, maxDays = 400): Promise<number> {
  if (!userId) return 0;
  try {
    const today = todayIST();

    const challenges = await DailyChallenge.find({ date: { $lte: today } })
      .sort({ date: -1 })
      .limit(maxDays)
      .select('_id date')
      .lean() as any[];
    if (!challenges.length) return 0;

    const entries = await DailyChallengeEntry.find({
      userId,
      challengeId: { $in: challenges.map(c => String(c._id)) },
    })
      .select('challengeId')
      .lean() as any[];
    const done = new Set(entries.map(e => String(e.challengeId)));

    const byDate = new Map<string, string>(challenges.map(c => [c.date, String(c._id)]));

    let streak = 0;
    const d = new Date(today + 'T00:00:00Z');
    for (let i = 0; i < maxDays; i++) {
      const ds = d.toISOString().split('T')[0];
      const chId = byDate.get(ds);
      if (!chId || !done.has(chId)) break;
      streak++;
      d.setUTCDate(d.getUTCDate() - 1);
    }
    return streak;
  } catch {
    return 0;
  }
}
