'use client';
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-line">
        <h2 className="font-bold text-fg text-sm">Send a Message</h2>
        <p className="text-xs text-muted mt-0.5">We read every message. Please be specific about your issue.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">Name</label>
            <input
              name="name" value={form.name} onChange={handleChange} required
              placeholder="Your name"
              className="w-full bg-elevated border border-line-strong rounded-lg px-3 py-2 text-sm text-fg placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Email</label>
            <input
              name="email" type="email" value={form.email} onChange={handleChange} required
              placeholder="your@email.com"
              className="w-full bg-elevated border border-line-strong rounded-lg px-3 py-2 text-sm text-fg placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Subject</label>
          <select
            name="subject" value={form.subject} onChange={handleChange} required
            className="w-full bg-elevated border border-line-strong rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent/50 transition-colors"
          >
            <option value="">Select a subject…</option>
            <option>Payment / Registration Issue</option>
            <option>Account / Login Problem</option>
            <option>WCA ID Verification</option>
            <option>Bug Report</option>
            <option>Competition Query</option>
            <option>Partnership / Sponsorship</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Message</label>
          <textarea
            name="message" value={form.message} onChange={handleChange} required rows={5}
            placeholder="Describe your issue in detail. For payment problems, include your CL ID and payment reference number."
            className="w-full bg-elevated border border-line-strong rounded-lg px-3 py-2 text-sm text-fg placeholder-muted focus:outline-none focus:border-accent/50 transition-colors resize-none"
          />
        </div>
        {status === 'sent' ? (
          <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400">
            Message sent! We&apos;ll get back to you within 24 hours.
          </div>
        ) : status === 'error' ? (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
            Failed to send. Please email us directly at support@cubelelo.com
          </div>
        ) : (
          <button
            type="submit"
            disabled={status === 'sending'}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-60 text-black font-bold text-sm transition-all"
          >
            {status === 'sending' ? (
              <><Loader2 size={14} className="animate-spin" /> Sending…</>
            ) : 'Send Message'}
          </button>
        )}
      </form>
    </div>
  );
}
