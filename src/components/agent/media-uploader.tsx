'use client';

import { IconPhoto } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { btn, cardClass, errorTextClass } from '@/components/ui/styles';
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

  async function uploadOne(file: File, sortOrder: number, isCover: boolean, token: string) {
    const supabase = createClient();
    const signed = await apiFetch<SignedUpload>('/media/sign-upload', {
      method: 'POST',
      body: JSON.stringify({
        propertyId,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      }),
      token,
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
        sortOrder,
        isCover,
      }),
      token,
    });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      // 逐張循序上傳，維持 sort_order 穩定
      for (const [index, file] of files.entries()) {
        await uploadOne(
          file,
          images.length + index,
          images.length === 0 && index === 0,
          session.access_token,
        );
      }

      router.refresh();
    } catch {
      setError(labels.uploadError);
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <section className={`${cardClass} flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{labels.photosSection}</h2>
        <label className={`${btn.primary} cursor-pointer`}>
          {pending ? labels.uploading : labels.upload}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={pending}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className={errorTextClass}>{error}</p>}

      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 py-8 text-neutral-500 dark:border-neutral-700">
          <IconPhoto size={28} aria-hidden />
          <p className="text-sm">{labels.upload}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
            <img
              key={image.id}
              src={storagePublicUrl(image.storage_path!)}
              alt={`${labels.photosSection} ${index + 1}`}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}
    </section>
  );
}
