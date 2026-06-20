import { redirect } from 'next/navigation';

// PRD route /terminal → implemented at /timer
export default function TerminalRedirect() {
  redirect('/timer');
}
