// PRD：初期鎖定加拿大三大城市
export const CITIES = ['Edmonton', 'Vancouver', 'Toronto'] as const;

export const ORIENTATIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export const BASEMENT_STATUSES = ['none', 'storage', 'livable', 'parking'] as const;

export const PROPERTY_TYPES = ['house', 'condo', 'townhouse', 'apartment'] as const;

// 生活機能標籤（存於 properties.custom_attributes 的 boolean key）
export const AMENITIES = ['superstore', 'transit_station', 'park', 'hospital'] as const;
export type Amenity = (typeof AMENITIES)[number];

// Persona 範本：選了「你是哪種買家」後，直接帶入對應的篩選檔位
// （未列出的欄位一律重設為「不限」，使用者可再手動微調）
export interface PersonaPreset {
  maxPrice?: number;
  minSchool?: number;
  minBuilder?: number;
  minMaterial?: number;
  orientation?: string;
  amenities?: readonly Amenity[];
}

export const PERSONAS = [
  {
    code: 'first_time_buyer',
    icon: '🌱',
    // 小資首購：預算優先 + 通勤方便
    preset: { maxPrice: 750_000, amenities: ['transit_station'] },
  },
  {
    code: 'school_parent',
    icon: '🎓',
    // 學區家長：學區排名優良以上
    preset: { minSchool: 60 },
  },
  {
    code: 'quality_seeker',
    icon: '🏗️',
    // 建商品質控：建商與建材 4 星以上
    preset: { minBuilder: 4, minMaterial: 4 },
  },
  {
    code: 'feng_shui_believer',
    icon: '🧭',
    // 風水優先：預設坐北朝南（南向），可再自行改向
    preset: { orientation: 'S' },
  },
  {
    code: 'balanced',
    icon: '⚖️',
    // 均衡型：進階條件全部不限
    preset: {},
  },
] as const satisfies readonly {
  code: string;
  icon: string;
  preset: PersonaPreset;
}[];

