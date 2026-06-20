import { Lock } from 'lucide-react';

export const metadata = { title: 'Privacy Policy — Cubelelo Events' };

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly when you register or update your account: name, email address, state/city, profile photo, and WCA ID (optional). When you compete, we collect your solve times, scrambles, session data, and video links you submit. When you make a payment, Razorpay processes your payment information — we store only the payment reference, amount, and status. We do not store card numbers, UPI IDs, or bank account details.

We also collect usage data automatically: pages visited, device type, browser, and IP address. This is used to improve the platform and detect abuse.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Your information is used to: operate and provide the Cubelelo Events platform; display your public profile, competition history, and personal bests; send transactional emails (registration confirmations, round notifications, results); generate certificates and GST invoices; detect and prevent cheating and abuse; improve the platform through aggregate analytics.

We do not sell your personal data to third parties. We do not use your data for advertising purposes.`,
  },
  {
    title: '3. Public Information',
    body: `By default, the following is publicly visible on your profile: your name, CL ID, WCA ID (if linked), state/city, competition history, and personal best times. You can set your profile to Private in your account settings, which will hide your solve history from other users. Your name, CL ID, and competition results will still appear in the results archive for competitions you have competed in — this is required for the integrity of the public record.`,
  },
  {
    title: '4. Data Sharing',
    body: `We share data only with: Razorpay (for payment processing); Google (for OAuth login, if you choose it); email service providers (for transactional email delivery); and our hosting providers (Vercel, Supabase, Cloudflare). All third-party providers are bound by data processing agreements. We may disclose data if required by Indian law or to protect the rights and safety of our users.`,
  },
  {
    title: '5. Data Retention',
    body: `We retain your account data for as long as your account is active. Competition results are retained permanently as part of the public record. If you delete your account, your personal data (name, email, photo) is removed within 30 days, but your anonymous competition results and CL ID may remain in the results archive. Payment records are retained for 7 years as required by Indian tax law.`,
  },
  {
    title: '6. Security',
    body: `Passwords are stored using bcrypt hashing — we never store plaintext passwords. All data is transmitted over HTTPS. Authentication uses industry-standard JWT tokens. Payment processing is handled entirely by Razorpay's PCI-DSS compliant infrastructure.

Despite these measures, no system is completely secure. If you believe your account has been compromised, contact support@cubelelo.com immediately.`,
  },
  {
    title: '7. Cookies',
    body: `We use cookies for authentication (session tokens) and to remember your theme preference (dark/light). We do not use tracking cookies or advertising cookies. You can disable cookies in your browser settings, but this will prevent login from working.`,
  },
  {
    title: '8. Your Rights',
    body: `You may access, correct, or delete your personal data at any time via your Profile Settings page. To request data export or account deletion, email support@cubelelo.com with your CL ID. We will respond within 30 days. If you have a complaint about how we handle your data, you may contact India's data protection authority.`,
  },
  {
    title: '9. Children',
    body: `Cubelelo Events is open to users of all ages. For users under 13, we request that a parent or guardian supervise account creation. We do not knowingly collect data from children under 13 without parental consent. If you believe we have collected data from a child under 13 without consent, contact us immediately at support@cubelelo.com.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this policy from time to time. Significant changes will be communicated via email and the site announcement banner at least 14 days before taking effect. Continued use of the platform after changes take effect constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={20} className="text-[#00dbe7]" />
            <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
          </div>
          <p className="text-[#8b949e] text-sm">
            Cubelelo Events Platform · Operated by Cubelelo (India)
          </p>
          <p className="text-xs text-[#8b949e] font-mono mt-1">Effective: June 2026</p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map(({ title, body }) => (
            <div key={title} className="bg-[#0d1117] border border-[#21262d] rounded-2xl p-6">
              <h2 className="font-bold text-white text-sm mb-3">{title}</h2>
              <div className="text-sm text-[#8b949e] leading-relaxed whitespace-pre-line">{body}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-[#0d1117] border border-[#00dbe7]/20 rounded-2xl">
          <p className="text-xs text-[#8b949e]">
            Questions or requests regarding this policy:{' '}
            <a href="mailto:support@cubelelo.com" className="text-[#00dbe7] hover:underline">
              support@cubelelo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
