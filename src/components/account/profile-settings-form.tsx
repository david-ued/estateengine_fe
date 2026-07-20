'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  btn,
  cardClass,
  errorTextClass,
  inputClass,
  successTextClass,
} from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { createClient } from '@/lib/supabase/client';

type Labels = Dictionary['account']['settings'];

/**
 * 買家帳號設定：
 * - 個人資料：更新 profiles.display_name（RLS 允許改自己的列）
 * - 變更密碼：supabase.auth.updateUser
 * Email 僅唯讀顯示（改信箱走 Supabase 驗證流程，本頁不處理）。
 */
export function ProfileSettingsForm({
  userId,
  email,
  initialDisplayName,
  labels,
}: Readonly<{
  userId: string;
  email: string;
  initialDisplayName: string;
  labels: Labels;
}>) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [profilePending, setProfilePending] = useState(false);
  const [profileMsg, setProfileMsg] = useState<'saved' | 'error' | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwPending, setPwPending] = useState(false);
  const [pwMsg, setPwMsg] = useState<
    'saved' | 'error' | 'mismatch' | 'short' | null
  >(null);

  async function handleProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfilePending(true);
    setProfileMsg(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('id', userId);

    setProfilePending(false);
    if (error) {
      setProfileMsg('error');
      return;
    }
    setProfileMsg('saved');
    router.refresh();
  }

  async function handlePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwMsg(null);

    if (newPassword.length < 6) {
      setPwMsg('short');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg('mismatch');
      return;
    }

    setPwPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwPending(false);

    if (error) {
      setPwMsg('error');
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setPwMsg('saved');
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      {/* 個人資料 */}
      <form onSubmit={handleProfile} className={cardClass}>
        <h2 className="text-lg font-semibold">{labels.profileSection}</h2>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {labels.email}
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className={`${inputClass} cursor-not-allowed opacity-60`}
            />
            <span className="text-xs text-neutral-400">
              {labels.emailReadonly}
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {labels.displayName}
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              className={inputClass}
            />
          </label>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button
            type="submit"
            disabled={profilePending}
            className={btn.primary}
          >
            {profilePending ? labels.saving : labels.save}
          </button>
          {profileMsg === 'saved' && (
            <p className={successTextClass}>{labels.saved}</p>
          )}
          {profileMsg === 'error' && (
            <p className={errorTextClass}>{labels.saveError}</p>
          )}
        </div>
      </form>

      {/* 變更密碼 */}
      <form onSubmit={handlePassword} className={cardClass}>
        <h2 className="text-lg font-semibold">{labels.passwordSection}</h2>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {labels.newPassword}
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {labels.confirmPassword}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button type="submit" disabled={pwPending} className={btn.primary}>
            {pwPending ? labels.saving : labels.updatePassword}
          </button>
          {pwMsg === 'saved' && (
            <p className={successTextClass}>{labels.saved}</p>
          )}
          {pwMsg === 'short' && (
            <p className={errorTextClass}>{labels.passwordTooShort}</p>
          )}
          {pwMsg === 'mismatch' && (
            <p className={errorTextClass}>{labels.passwordMismatch}</p>
          )}
          {pwMsg === 'error' && (
            <p className={errorTextClass}>{labels.saveError}</p>
          )}
        </div>
      </form>
    </div>
  );
}
