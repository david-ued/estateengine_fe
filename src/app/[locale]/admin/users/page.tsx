import { notFound } from 'next/navigation';
import { RoleActions } from '@/components/admin/role-actions';
import {
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from '@/components/ui/styles';
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
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th scope="col" className={thClass}>{dict.auth.fullName}</th>
                <th scope="col" className={thClass}>{dict.admin.email}</th>
                <th scope="col" className={thClass}>{dict.admin.role}</th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">{dict.admin.role}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={trClass}>
                  <td className={tdClass}>
                    <div className="font-medium">
                      {user.display_name ?? user.full_name ?? '—'}
                    </div>
                    {user.agency_name && (
                      <div className="text-neutral-500">{user.agency_name}</div>
                    )}
                  </td>
                  <td className={`${tdClass} text-neutral-500`}>{user.email ?? '—'}</td>
                  <td className={tdClass}>{dict.admin.roleLabels[user.role]}</td>
                  <td className={`${tdClass} text-right`}>
                    {user.role !== 'super_admin' && (
                      <RoleActions
                        userId={user.id}
                        role={user.role}
                        labels={{
                          makeAgent: dict.admin.makeAgent,
                          makeBuyer: dict.admin.makeBuyer,
                          actionError: dict.admin.actionError,
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
