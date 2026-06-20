import type { Metadata } from 'next';
import { HelpCircle } from 'lucide-react';
import FAQAccordion from './FAQAccordion';

export const metadata: Metadata = { title: 'FAQs — Cubelelo Events' };

const FAQS = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'Do I need to pay to create an account?',
        a: 'No — creating an account on Cubelelo Events is completely free. You only pay when registering for paid competitions.',
      },
      {
        q: 'I already have an account on the old Cubelelo Events site. Do I need to re-register?',
        a: 'No. Your existing account, CL ID, and competition history have been migrated. Visit the Account Claim page, enter your old CL ID or email, and set a new password. Everything will be waiting for you.',
      },
      {
        q: 'What is a CL ID?',
        a: 'Your Cubelelo ID (e.g. CL0001) is a unique identifier assigned to every competitor. It appears on your profile, your certificates, and the leaderboards. It persists for life — it never changes.',
      },
      {
        q: 'Can I link my WCA ID to my profile?',
        a: 'Yes. Go to Profile → Edit Profile and enter your WCA ID. The system will attempt to verify it automatically via the WCA public API. If auto-verification fails, an admin will verify it manually within 48 hours.',
      },
    ],
  },
  {
    category: 'Competitions',
    items: [
      {
        q: 'How do online competitions work?',
        a: 'When a round opens, all registered competitors see the same WCA-compliant scramble at the same moment. You apply the scramble to your physical cube, use the built-in timer to record your solve, submit your time, and provide a video link. Results are verified by our judge team.',
      },
      {
        q: 'Can I compete on a mobile phone?',
        a: 'Yes — the timer is fully optimised for mobile. Hold two fingers on the screen to arm, release to start, and tap to stop. The site is mobile-first.',
      },
      {
        q: 'What do I need for a video submission?',
        a: 'Upload your video to YouTube (public or unlisted) or Google Drive (shared with anyone who has the link) and paste the link after your solves. The video must show the scrambled cube, the full solve, the timer display throughout, and the final solved state.',
      },
      {
        q: 'What is the round window?',
        a: 'Each round has a defined open and close time. The timer is only active during this window. If you miss the window, you cannot submit. Window times are shown in IST on the competition page.',
      },
      {
        q: 'What happens if I miss the cutoff?',
        a: 'For events with a WCA cutoff: if you do not beat the cutoff time in your first two solves, your round ends. The remaining solves are marked as DNS and your result is calculated from the solves completed.',
      },
      {
        q: 'How does round advancement work?',
        a: 'After each round closes, the system ranks competitors and advances the top N (set by the admin) to the next round. You will receive a notification if you advance.',
      },
    ],
  },
  {
    category: 'Payments & Refunds',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'We use Razorpay — you can pay via UPI, debit/credit card, net banking, or wallet (Paytm, PhonePe, etc.).',
      },
      {
        q: 'Are registration fees refundable?',
        a: 'Registration fees are non-refundable. Please read the competition rules and confirm your availability before paying.',
      },
      {
        q: 'I paid but my registration is not showing. What should I do?',
        a: 'Wait 5 minutes — payment confirmations can be delayed. If the problem persists, email us with your payment reference number and CL ID. Do not attempt to pay again.',
      },
      {
        q: 'Can I get a GST invoice?',
        a: 'Yes. A GST-compliant invoice is auto-generated after payment and is available to download from your My Registrations page.',
      },
    ],
  },
  {
    category: 'Timer & Technical',
    items: [
      {
        q: 'Do I need to install anything to use the timer?',
        a: 'No. The timer runs entirely in your browser. No app installation required on desktop or mobile.',
      },
      {
        q: 'Is the timer WCA-compliant?',
        a: 'Yes. The timer runs in a Web Worker for millisecond accuracy, uses performance.now() for timing, and follows WCA inspection rules (8s free inspection, +2 at 15s, DNF at 17s).',
      },
      {
        q: 'What keyboard shortcuts does the timer support?',
        a: 'Space = arm/start/stop, D = mark DNF, P = mark +2, Z = undo last solve, Escape = cancel inspection.',
      },
      {
        q: 'What is the 2D cube visualizer?',
        a: 'After each scramble is generated, a 2D net (unfolded diagram) of the scrambled cube state is displayed. It lets you verify your scramble application is correct.',
      },
    ],
  },
  {
    category: 'Rules & Fair Play',
    items: [
      {
        q: 'My result was flagged. What does that mean?',
        a: 'Our system automatically flags results that are statistically unusual compared to your solve history. Flagged results are queued for judge review — they are not automatically disqualified. Judges check your video and make the final call.',
      },
      {
        q: 'How do I appeal a result?',
        a: 'Submit a written appeal via the competition results page within 24 hours of results being published. Include your video link and reason for appeal. Admin decisions are final.',
      },
      {
        q: 'What happens if I am caught cheating?',
        a: 'Verified cheating results in permanent account suspension. All results from the affected competition are removed from the records.',
      },
    ],
  },
];

export default function FAQsPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={20} className="text-accent" />
            <h1 className="text-3xl font-black text-fg">Frequently Asked Questions</h1>
          </div>
          <p className="text-muted">
            Can&apos;t find your answer here? Email us at{' '}
            <a href="mailto:support@cubelelo.com" className="text-accent hover:underline">
              support@cubelelo.com
            </a>
          </p>
        </div>
        <FAQAccordion faqs={FAQS} />
      </div>
    </div>
  );
}
