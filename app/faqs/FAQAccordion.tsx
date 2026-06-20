'use client';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem { q: string; a: string }
interface FAQCategory { category: string; items: FAQItem[] }

function FAQRow({ q, a }: FAQItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#21262d] last:border-none">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-[#161b22] transition-colors"
      >
        <span className="text-sm font-semibold text-white leading-snug">{q}</span>
        <ChevronDown
          size={16}
          className={`text-[#8b949e] flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-[#8b949e] leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function FAQAccordion({ faqs }: { faqs: FAQCategory[] }) {
  return (
    <div className="space-y-6">
      {faqs.map(({ category, items }) => (
        <div key={category} className="bg-[#0d1117] border border-[#21262d] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#21262d]">
            <h2 className="text-xs font-bold text-[#00dbe7] uppercase tracking-wider">{category}</h2>
          </div>
          {items.map(item => <FAQRow key={item.q} {...item} />)}
        </div>
      ))}
    </div>
  );
}
