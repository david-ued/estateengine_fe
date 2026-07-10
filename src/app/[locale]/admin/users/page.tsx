import { notFound } from 'next/navigation';
import { RoleActions } from '@/components/admin/role-actions';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  role: 'buyer' | 'agent' | 'super_admin';
  agency_name: string | null;
}

/** Admin：使用者管理（升級房仲 / 降級買家） */
export default async function AdminUsersPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireRole(locale, ['super_admin']);
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, display_name, role, agency_name')
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<UserRow[]>();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-8">
      <h2 className="mb-6 text-xl font-bold">{dict.admin.usersNav}</h2>

      {!users || users.length === 0 ? (
        <p className="text-neutral-500">{dict.admin.usersEmpty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3">{dict.auth.fullName}</th>
                <th className="px-4 py-3">{dict.admin.email}</th>
                <th className="px-4 py-3">{dict.admin.role}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {user.display_name ?? user.full_name ?? '—'}
                    </div>
                    {user.agency_name && (
                      <div className="text-neutral-500">{user.agency_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{user.email ?? '—'}</td>
                  <td className="px-4 py-3">{dict.admin.roleLabels[user.role]}</td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== 'super_admin' && (
                      <RoleActions
                        userId={user.id}
                        role={user.role}
                        labels={{
                          makeAgent: dict.admin.makeAgent,
                          makeBuyer: dict.admin.makeBuyer,
                        }}
                      />
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
