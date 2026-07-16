import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CreateUserForm } from '@/components/admin/create-user-form';
import { DeleteUserButton } from '@/components/admin/delete-user-button';
import { RoleSelect } from '@/components/admin/role-select';
import {
  btn,
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  role: 'buyer' | 'agent';
  agency_name: string | null;
}

interface UsersResult {
  items: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

// service_role 繞過 RLS 讀取全部 profiles，故會員清單一律走後端（agent 的 session
// 受 RLS 限制只讀得到自己與其他 agent，讀不到買家）
async function fetchUsers(token: string): Promise<UsersResult | null> {
  try {
    return await apiFetch<UsersResult>('/users?page=1&pageSize=100', {
      token,
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}

/** 會員管理：唯一 agent（admin）可新增帳號、指派角色、刪除 */
export default async function AgentUsersPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { user: admin } = await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const result = session ? await fetchUsers(session.access_token) : null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{dict.admin.usersTitle}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {dict.admin.usersSubtitle}
        </p>
      </div>

      <CreateUserForm
        labels={{
          createUser: dict.admin.createUser,
          creating: dict.admin.creating,
          email: dict.admin.email,
          password: dict.auth.password,
          fullName: dict.auth.fullName,
          role: dict.admin.role,
          roleLabels: dict.admin.roleLabels,
          actionError: dict.admin.actionError,
        }}
      />

      {result === null ? (
        <div className="flex flex-col items-center gap-4 border border-neutral-200 py-16 text-center dark:border-neutral-800">
          <p className="text-neutral-500">{dict.admin.loadError}</p>
          <Link href={`/${locale}/agent/users`} className={btn.secondary}>
            {dict.common.retry}
          </Link>
        </div>
      ) : result.items.length === 0 ? (
        <p className="border border-neutral-200 px-6 py-16 text-center text-neutral-500 dark:border-neutral-800">
          {dict.admin.usersEmpty}
        </p>
      ) : (
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th scope="col" className={thClass}>
                  {dict.auth.fullName}
                </th>
                <th scope="col" className={thClass}>
                  {dict.admin.email}
                </th>
                <th scope="col" className={thClass}>
                  {dict.admin.role}
                </th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">{dict.admin.role}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((user) => (
                <tr key={user.id} className={trClass}>
                  <td className={tdClass}>
                    <div className="font-medium">
                      {user.display_name ?? user.full_name ?? '—'}
                    </div>
                    {user.agency_name && (
                      <div className="text-neutral-500">{user.agency_name}</div>
                    )}
                  </td>
                  <td className={`${tdClass} text-neutral-500`}>
                    {user.email ?? '—'}
                  </td>
                  <td className={tdClass}>{dict.admin.roleLabels[user.role]}</td>
                  <td className={`${tdClass} text-right`}>
                    <span className="flex items-start justify-end gap-2">
                      <RoleSelect
                        userId={user.id}
                        role={user.role}
                        disabled={user.id === admin.id}
                        labels={{
                          roleLabels: dict.admin.roleLabels,
                          actionError: dict.admin.actionError,
                        }}
                      />
                      {user.id !== admin.id && (
                        <DeleteUserButton
                          userId={user.id}
                          labels={{
                            delete: dict.admin.delete,
                            deleteConfirm: dict.admin.deleteConfirm,
                            deleteBlocked: dict.admin.deleteBlocked,
                            actionError: dict.admin.actionError,
                          }}
                        />
                      )}
                    </span>
                    {user.id === admin.id && (
                      <div className="mt-1 text-xs text-neutral-400">
                        {dict.admin.selfNote}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
