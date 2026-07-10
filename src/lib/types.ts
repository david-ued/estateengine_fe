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
