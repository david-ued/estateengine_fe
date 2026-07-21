'use client';

import { IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SignupForm } from '@/components/auth/signup-form';
import type { Dictionary } from '@/i18n/get-dictionary';

/** 「免費註冊」彈窗：原地開啟註冊表單，不離開目前頁面（獨家數據 gating CTA 用） */
export function SignupModal({
  labels,
  triggerLabel,
  triggerClass,
  closeLabel,
}: Readonly<{
  labels: Dictionary['auth'];
  triggerLabel: string;
  triggerClass: string;
  closeLabel: string;
}>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {triggerLabel}
      </button>

      {/* portal 到 body：觸發點可能在有 transform 的祖先（如 Reveal）內，fixed 會被攔截 */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={labels.signupTitle}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden border border-neutral-200 bg-white text-neutral-900 sm:max-w-sm sm:shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
                {labels.signupTitle}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="p-1.5 transition-colors hover:text-gold"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
              <p className="text-sm text-neutral-500">{labels.signupSubtitle}</p>
              <SignupForm labels={labels} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
