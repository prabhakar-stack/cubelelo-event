import { redirect } from 'next/navigation';

// /practice/daily → canonical daily challenge page
export default function PracticeDailyRedirect() {
  redirect('/daily-challenge');
}
