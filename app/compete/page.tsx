import { redirect } from 'next/navigation';

// The competition listing lives at /competitions. This route used to duplicate it;
// keep the path working by redirecting. (/compete/[id]… live terminal routes stay.)
export default function CompeteRedirect() {
  redirect('/competitions');
}
