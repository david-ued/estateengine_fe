'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { storagePublicUrl } from '@/lib/media';
import { createClient } from '@/lib/supabase/client';
import type { MediaItem } from '@/lib/types';

interface SignedUpload {
  path: string;
  signedUrl: string;
  token: string;
}

/** 照片上傳：BE 簽名 → 直傳 Storage → 登記 media row */
export function MediaUploader({
  propertyId,
  labels,
  existing,
}: Readonly<{
  propertyId: string;
  labels: Dictionary['agentForm'];
  existing: MediaItem[];
}>) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const images = existing
    .filter((m) => (m.type === 'image' || m.type === 'virtual_staging_image') && m.storage_path)
    .sort((a, b) => a.sort_order - b.sort_order);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      const signed = await apiFetch<SignedUpload>('/media/sign-upload', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
        }),
        token: session.access_token,
      });

      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .uploadToSignedUrl(signed.path, signed.token, file);
      if (uploadError) throw uploadError;

      await apiFetch('/media/uploaded', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          type: 'image',
          storagePath: signed.path,
          mimeType: file.type,
          fileSizeBytes: file.size,
          sortOrder: images.length,
          isCover: images.length === 0,
        }),
        token: session.access_token,
      });

      router.refresh();
    } catch {
      setError(labels.uploadError);
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{labels.photosSection}</h2>
        <label className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900">
          {pending ? labels.uploading : labels.upload}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={pending}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
            <img
              key={image.id}
              src={storagePublicUrl(image.storage_path!)}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}
    </section>
  );
}
