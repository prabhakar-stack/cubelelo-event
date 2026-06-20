import Link from 'next/link';
import { Trophy, Zap, Globe, Users, Heart, Award } from 'lucide-react';

export const metadata = { title: 'About Us — Cubelelo Events' };

const STATS = [
  { value: '10,000+', label: 'Registered Cubers' },
  { value: '200+', label: 'Competitions Hosted' },
  { value: '50+', label: 'WCA Events Supported' },
  { value: '5+', label: 'Years Running' },
];

const PILLARS = [
  {
    icon: Zap,
    title: 'WCA-Standard Timing',
    body: 'Every competition uses WCA-compliant scrambles, inspection rules, and timing — the same standard as official world competitions.',
  },
  {
    icon: Globe,
    title: 'Compete From Anywhere',
    body: 'No travel required. Compete from home using our built-in timer, verified by video submission and statistical analysis.',
  },
  {
    icon: Users,
    title: 'Community First',
    body: 'Built by cubers, for cubers. Every feature — from the daily challenge to the live leaderboard — is designed around what the community actually wants.',
  },
  {
    icon: Heart,
    title: 'Accessible to All',
    body: 'Beginners and sub-10 solvers alike are welcome. Our tier system and practice tools help every cuber improve.',
  },
  {
    icon: Award,
    title: 'Real Prizes',
    body: 'Cash prizes, QiYi cubes, and medals for podium finishers. Every competition has something worth competing for.',
  },
  {
    icon: Trophy,
    title: 'Permanent Records',
    body: 'Every result, every PB, every competition you\'ve ever entered — recorded permanently on your public profile.',
  },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Hero */}
      <div className="bg-surface border-b border-line">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold mb-6">
            <Trophy size={12} />
            India&apos;s Online Speedcubing Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-fg mb-5 leading-tight">
            We&apos;re building the home<br />
            <span className="text-accent">of competitive cubing</span> in India
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Cubelelo Events is the official online competition platform by Cubelelo — India&apos;s largest
            speedcubing community. From first-time solvers to national champions, every cuber has a place here.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-line bg-surface/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-black text-accent mb-1">{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-black text-fg mb-4">Our Story</h2>
          <p className="text-muted leading-relaxed mb-4">
            Cubelelo started as a passion project — a way to get quality speedcubing equipment into Indian cubers&apos;
            hands. Over the years it grew into something much bigger: a full community platform, a content hub,
            and now, a dedicated competition system.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            Cubelelo Events was built because the community asked for it. Indian cubers are world-class — we&apos;ve
            seen it at WCA events across the country — but access to competitive experience was limited by geography
            and scheduling. Online competitions change that.
          </p>
          <p className="text-muted leading-relaxed">
            Today Cubelelo Events runs weekly competitions across all major WCA events, with multi-round structures,
            live leaderboards, and prizes that matter. The platform is built from the ground up for the Indian
            speedcubing community, with WCA-standard rules and a mobile-first experience because most of our
            cubers compete on their phones.
          </p>
        </div>

        {/* Pillars */}
        <h2 className="text-2xl font-black text-fg mt-16 mb-8">What we stand for</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-surface border border-line rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
                <Icon size={16} className="text-accent" />
              </div>
              <h3 className="font-bold text-fg text-sm mb-2">{title}</h3>
              <p className="text-xs text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted mb-4">Ready to compete?</p>
          <Link href="/compete"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold transition-all">
            <Trophy size={16} />
            View Competitions
          </Link>
        </div>
      </div>
    </div>
  );
}
