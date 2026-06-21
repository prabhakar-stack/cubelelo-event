'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

/** Resize/crop an image file to a square data URL (cover fit). */
async function resizeToDataUrl(file: File, size = 256): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = URL.createObjectURL(file);
  });
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  URL.revokeObjectURL(img.src);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function AvatarUpload(
  { current, name, onChange }: { current?: string | null; name?: string; onChange?: (url: string) => void },
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr('');
    setSaving(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      const r = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePicture: dataUrl }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error ?? 'Upload failed'); }
      setPreview(dataUrl);
      onChange?.(dataUrl);
    } catch (e: any) {
      setErr(e.message ?? 'Upload failed');
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-20 h-20 rounded-full object-cover border border-line-strong" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-lime flex items-center justify-center text-black font-black text-2xl">
            {name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <button onClick={pick} aria-label="Change photo" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-elevated border border-line-strong flex items-center justify-center text-muted hover:text-fg transition-colors">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
        </button>
      </div>
      <div>
        <button onClick={pick} disabled={saving} className="text-sm text-accent hover:underline disabled:opacity-50">Change photo</button>
        <p className="text-xs text-muted mt-0.5">JPG or PNG, square works best.</p>
        {err && <p className="text-xs text-red-400 mt-0.5">{err}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
    </div>
  );
}
