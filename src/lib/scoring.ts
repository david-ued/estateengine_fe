// 客製化權重評分系統（Core Feature）
// 房仲建檔時為每個維度打 0-100 分（存於 properties 表），
// 買家自訂各維度權重（加總 100），前端即時算出符合度分數。

export const SCORE_DIMENSIONS = [
  'school',
  'transit',
  'material',
  'feng_shui',
  'environment',
] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

/** 物件各維度得分，0-100 */
export type ScoreCard = Partial<Record<ScoreDimension, number>>;

/** 買家權重（百分比），例如 { school: 50, transit: 30, material: 20 } */
export type WeightMap = Partial<Record<ScoreDimension, number>>;

/** 加權平均後回傳 0-100 的符合度分數 */
export function calcMatchScore(scores: ScoreCard, weights: WeightMap): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const dimension of SCORE_DIMENSIONS) {
    const weight = weights[dimension] ?? 0;
    if (weight <= 0) continue;
    weightedSum += (scores[dimension] ?? 0) * weight;
    totalWeight += weight;
  }

  return totalWeight === 0 ? 0 : Math.round(weightedSum / totalWeight);
}
