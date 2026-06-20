import Link from 'next/link';

const LINKS = [
  { href: '/about-us', label: 'About Us' },
  { href: '/rules', label: 'Rules' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/contact-us', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Cubelelo Events. All rights reserved.
        </p>
        <nav className="flex flex-wrap items-center gap-4">
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className="text-xs text-muted hover:text-fg transition-colors">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
