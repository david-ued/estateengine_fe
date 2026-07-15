// 對應 Supabase schema（snake_case）與 NestJS API 回傳形狀

export type PropertyStatus = 'draft' | 'published' | 'hidden' | 'delisted' | 'sold';

export type MediaType =
  | 'image'
  | 'reel_video'
  | 'external_video'
  | 'tour_3d'
  | 'virtual_staging_image'
  | 'floor_plan';

export interface MediaItem {
  id: string;
  property_id: string;
  type: MediaType;
  storage_path: string | null;
  external_url: string | null;
  thumbnail_path: string | null;
  sort_order: number;
  is_cover: boolean;
  click_count: number;
}

export interface AgentCard {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  agency_name: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  license_no?: string | null;
  contact_line_id?: string | null;
  social_links?: Record<string, string>;
}

export interface Property {
  id: string;
  agent_id: string;
  status: PropertyStatus;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  city: string;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  area_sqft: number;
  beds: number;
  baths: number;
  property_type: string | null;
  has_parking: boolean;
  school_district: string | null;
  transit_notes: string | null;
  flood_zone: boolean;
  terrain_notes: string | null;
  feng_shui_orientation: string | null;
  feng_shui_notes: string | null;
  builder_name: string | null;
  builder_reputation: number | null;
  material_grade: number | null;
  basement_status: 'none' | 'storage' | 'livable' | 'parking';
  custom_attributes?: Record<string, unknown> & { superstore?: boolean };
  score_school: number | null;
  score_transit: number | null;
  score_material: number | null;
  score_feng_shui: number | null;
  score_environment: number | null;
  listed_at: string | null;
  view_count: number;
  media?: MediaItem[];
  agent?: AgentCard;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------- 單一 agent 品牌站（PIVOT.md） ----------

/** site_settings.data 內的單語系品牌文案 */
export interface SiteLocaleCopy {
  heroTitle?: string;
  heroSubtitle?: string;
  story?: string;
  values?: { title: string; body: string }[];
}

/** site_settings.data 結構（agent 於品牌設定頁編輯） */
export interface SiteSettingsData {
  stats?: { sold?: number; volume?: string; years?: number };
  locales?: Partial<Record<'zh-TW' | 'en', SiteLocaleCopy>>;
}

/** GET /site 回傳 */
export interface SiteInfo {
  settings: SiteSettingsData;
  agent: AgentCard | null;
}

export interface SavedSearch {
  id: string;
  name: string;
  params: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface FavoriteEntry {
  created_at: string;
  property: Property;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  locale: string | null;
  is_read: boolean;
  created_at: string;
  property?: { id: string; title: string } | null;
}
