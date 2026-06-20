import type { Metadata } from 'next';
import { Mail, MessageCircle, HelpCircle, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ContactForm from './ContactForm';

export const metadata: Metadata = { title: 'Contact Us — Cubelelo Events' };

const CATEGORIES = [
  {
    icon: HelpCircle,
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
    title: 'General Questions',
    body: 'Check the FAQs first — most common questions are answered there.',
    action: { label: 'View FAQs', href: '/faqs' },
  },
  {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    title: 'Payment Issues',
    body: 'For missing registrations or payment failures, email us with your payment reference number and CL ID. Do not pay again before contacting us.',
    action: { label: 'Email Support', href: 'mailto:support@cubelelo.com' },
  },
  {
    icon: MessageCircle,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
    title: 'Result Appeals',
    body: 'Appeals must be submitted via the competition results page within 24 hours of publication.',
    action: { label: 'View Competitions', href: '/compete' },
  },
  {
    icon: Mail,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
    title: 'Everything Else',
    body: 'Account issues, WCA ID verification, bug reports, partnership enquiries — drop us an email.',
    action: { label: 'support@cubelelo.com', href: 'mailto:support@cubelelo.com' },
  },
];

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={20} className="text-accent" />
            <h1 className="text-3xl font-black text-fg">Contact Us</h1>
          </div>
          <p className="text-muted">
            We typically respond within 24 hours on weekdays.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {CATEGORIES.map(({ icon: Icon, color, bg, title, body, action }) => (
            <div key={title} className="bg-surface border border-line rounded-2xl p-5">
              <div className={`w-8 h-8 rounded-xl border ${bg} flex items-center justify-center mb-3`}>
                <Icon size={15} className={color} />
              </div>
              <h2 className="font-bold text-fg text-sm mb-2">{title}</h2>
              <p className="text-xs text-muted leading-relaxed mb-4">{body}</p>
              {action.href.startsWith('/') ? (
                <Link href={action.href}
                  className={`inline-flex items-center gap-1 text-xs ${color} hover:underline font-semibold`}>
                  {action.label} <ChevronRight size={12} />
                </Link>
              ) : (
                <a href={action.href}
                  className={`inline-flex items-center gap-1 text-xs ${color} hover:underline font-semibold`}>
                  {action.label} <ChevronRight size={12} />
                </a>
              )}
            </div>
          ))}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
