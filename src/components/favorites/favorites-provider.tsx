'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

/**
 * 全站收藏狀態：登入後抓一次 /favorites/ids，
 * 愛心按鈕樂觀更新，跨列表 / 內頁 / 帳號中心同步。
 */
interface FavoritesContextValue {
  /** null = 尚未解析登入狀態 */
  signedIn: boolean | null;
  ids: ReadonlySet<string>;
  toggle: (propertyId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  signedIn: null,
  ids: new Set(),
  toggle: async () => {},
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

// build 時就決定（NEXT_PUBLIC_* 內聯），Supabase 未設定時整個 provider 靜止
const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(
    SUPABASE_CONFIGURED ? null : false,
  );
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;

    const supabase = createClient();
    let active = true;

    async function hydrate(token: string | null) {
      if (!active) return;
      if (!token) {
        setSignedIn(false);
        setIds(new Set());
        return;
      }
      setSignedIn(true);
      try {
        const favoriteIds = await apiFetch<string[]>('/favorites/ids', {
          token,
        });
        if (active) setIds(new Set(favoriteIds));
      } catch {
        // BE 未啟動時愛心仍可顯示，只是不保存
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => hydrate(data.session?.access_token ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        void hydrate(session?.access_token ?? null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const toggle = useCallback(
    async (propertyId: string) => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const isFavorite = ids.has(propertyId);

      // 樂觀更新，失敗回滾
      setIds((prev) => {
        const next = new Set(prev);
        if (isFavorite) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });

      try {
        await apiFetch(`/favorites/${propertyId}`, {
          method: isFavorite ? 'DELETE' : 'PUT',
          token,
        });
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          if (isFavorite) next.add(propertyId);
          else next.delete(propertyId);
          return next;
        });
      }
    },
    [ids],
  );

  const value = useMemo(
    () => ({ signedIn, ids, toggle }),
    [signedIn, ids, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
