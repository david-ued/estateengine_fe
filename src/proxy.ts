import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/i18n/config';

function getLocale(request: NextRequest): string {
  const header = request.headers.get('accept-language');
  if (!header) return defaultLocale;

  const requested = header
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase())
    .filter(Boolean);

  for (const tag of requested) {
    const exact = locales.find((locale) => locale.toLowerCase() === tag);
    if (exact) return exact;

    const base = tag.split('-')[0];
    const partial = locales.find((locale) => locale.toLowerCase().startsWith(base));
    if (partial) return partial;
  }

  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) 語系路由：路徑缺少語系時轉址
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // 尚未設定 Supabase 環境變數時（例如 DB 還沒接）直接放行，公開頁不受影響
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // 2) Supabase session 刷新：過期的 access token 在這裡換新，
  //    讓 Server Component 讀到有效的 auth cookie
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 略過 Next 內部資源、API route 與靜態檔案（帶副檔名的路徑）
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
