// PRD：初期鎖定加拿大三大城市
export const CITIES = ['Edmonton', 'Vancouver', 'Toronto'] as const;

export const ORIENTATIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export const BASEMENT_STATUSES = ['none', 'storage', 'livable', 'parking'] as const;

export const PROPERTY_TYPES = ['house', 'condo', 'townhouse', 'apartment'] as const;

// 生活機能標籤（存於 properties.custom_attributes 的 boolean key）
export const AMENITIES = ['superstore', 'transit_station', 'park', 'hospital'] as const;
export type Amenity = (typeof AMENITIES)[number];

// 預設 Persona 範本（與 DB persona_templates 種子一致；名稱走字典 personas.*）
// TODO：DB 連線後改為讀取 persona_templates 表
export const PERSONAS = [
  {
    code: 'first_time_buyer',
    icon: '🌱',
    weights: { transit: 35, environment: 30, material: 20, school: 15 },
  },
  {
    code: 'school_parent',
    icon: '🎓',
    weights: { school: 50, transit: 20, environment: 20, material: 10 },
  },
  {
    code: 'quality_seeker',
    icon: '🏗️',
    weights: { material: 40, environment: 25, transit: 25, school: 10 },
  },
  {
    code: 'feng_shui_believer',
    icon: '🧭',
    weights: { feng_shui: 40, environment: 20, school: 20, transit: 20 },
  },
  {
    code: 'balanced',
    icon: '⚖️',
    weights: { school: 20, transit: 20, material: 20, feng_shui: 20, environment: 20 },
  },
] as const;

