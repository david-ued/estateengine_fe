import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export type UserRole = 'buyer' | 'agent';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  agency_name: string | null;
}

/** 讀取目前登入者與其 profile（未登入或 Supabase 環境未設定時回傳 null） */
export async function getUserProfile() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, display_name, avatar_url, agency_name')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile) return null;
  return { user, profile };
}

/** 依角色決定登入後的首頁（agent 進後台，買家回首頁） */
export function homePathForRole(locale: string, role: UserRole): string {
  return role === 'agent' ? `/${locale}/agent` : `/${locale}`;
}

/**
 * 保護需登入的介面：未登入導向登入頁，角色不符導回首頁。
 */
export async function requireRole(locale: string, roles: UserRole[]) {
  const session = await getUserProfile();
  if (!session) redirect(`/${locale}/login`);

  const { role } = session.profile;
  if (!roles.includes(role)) {
    redirect(`/${locale}`);
  }

  return session;
}
