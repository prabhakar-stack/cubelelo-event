'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, User } from 'lucide-react';

interface SearchUser {
  clid: string;
  name: string;
  avatarUrl: string | null;
}

export default function SearchPage() {
  const params = useParams<{ query: string }>();
  const router = useRouter();
  const [query, setQuery] = useState(decodeURIComponent(params.query ?? ''));
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.users ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [runSearch, query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search/${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or CL ID…"
              className="w-full pl-9 pr-4 py-3 bg-elevated border border-line-strong rounded-xl text-sm text-fg placeholder-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </form>

        {/* Results */}
        {loading && (
          <p className="text-center text-sm text-muted">Searching…</p>
        )}

        {!loading && results.length === 0 && query.trim().length >= 2 && (
          <div className="text-center py-12 text-muted">
            <User size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No cubers found for &quot;{query}&quot;</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3 text-left w-10">#</th>
                  <th className="px-3 py-3 text-left">Name</th>
                  <th className="px-3 py-3 text-left">CL ID</th>
                </tr>
              </thead>
              <tbody>
                {results.map((user, i) => (
                  <tr
                    key={user.clid}
                    onClick={() => router.push(`/profile/${user.clid}`)}
                    className="border-b border-line last:border-0 hover:bg-elevated cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 text-muted font-mono">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-line flex items-center justify-center">
                            <User size={12} className="text-muted" />
                          </div>
                        )}
                        <span className="font-medium text-fg capitalize">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-accent text-xs">{user.clid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results.length > 0 && (
          <p className="mt-3 text-xs text-muted text-center">
            {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
