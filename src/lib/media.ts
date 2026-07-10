import type { MediaItem, Property } from './types';
import type { ScoreCard } from './scoring';

/** Supabase Storage 公開 URL（property-media bucket） */
export function storagePublicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-media/${path}`;
}

/** 物件封面圖：優先 is_cover，其次第一張圖片 */
export function coverImageUrl(property: Property): string | null {
  const images = (property.media ?? [])
    .filter((m) => (m.type === 'image' || m.type === 'virtual_staging_image') && m.storage_path)
    .sort((a, b) => a.sort_order - b.sort_order);
  const cover = images.find((m) => m.is_cover) ?? images[0];
  return cover?.storage_path ? storagePublicUrl(cover.storage_path) : null;
}

/** 外部嵌入媒體（影片 / 3D 導覽） */
export function externalMedia(property: Property): MediaItem[] {
  return (property.media ?? [])
    .filter((m) => (m.type === 'external_video' || m.type === 'tour_3d') && m.external_url)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** 權重評分用的分數卡 */
export function toScoreCard(property: Property): ScoreCard {
  return {
    school: property.score_school ?? undefined,
    transit: property.score_transit ?? undefined,
    material: property.score_material ?? undefined,
    feng_shui: property.score_feng_shui ?? undefined,
    environment: property.score_environment ?? undefined,
  };
}

/** 觀看用嵌入 URL（YouTube / Vimeo / Matterport） */
export function toEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.endsWith('youtu.be')) {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }
    if (host.endsWith('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      return url;
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
      return url;
    }
    // Matterport（my.matterport.com/show/?m=...）與其他已是嵌入格式
    return url;
  } catch {
    return url;
  }
}
