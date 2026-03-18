/**
 * DataForSEO API から返却されるリード1件の型（API レスポンス用）
 */
export type LeadItem = {
  title: string;
  address: string;
  phone: string | null;
  rating: number | null;
  votes_count: number | null;
  domain: string | null;
  is_meo_weak: boolean;
  rank_absolute: number;
  is_claimed: boolean;
  book_online_url: string | null;
  total_photos: number;
  is_hours_missing: boolean;
  is_currently_open: boolean;
  price_level: string | null;
  latitude: number | null;
  longitude: number | null;
  categories: string[];
  main_image: string | null;
  is_masked?: boolean;
};

/**
 * UI で利用するリード型（変換後）
 */
export type Lead = {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  website: string | null;
  status: "meo-weak" | "no-website" | "excellent";
  rankAbsolute: number;
  isClaimed: boolean;
  bookOnlineUrl: string | null;
  totalPhotos: number;
  isHoursMissing: boolean;
  isCurrentlyOpen: boolean;
  priceLevel: string | null;
  latitude: number | null;
  longitude: number | null;
  categories: string[];
  mainImage: string | null;
  isMasked?: boolean;
};

/**
 * API の LeadItem を UI の Lead に変換する
 */
export function mapLeadItemToLead(item: LeadItem, index: number): Lead {
  const hasWebsite = item.domain != null && item.domain !== "";
  let status: Lead["status"];
  if (item.is_meo_weak) {
    status = "meo-weak";
  } else if (!hasWebsite) {
    status = "no-website";
  } else {
    status = "excellent";
  }
  return {
    id: `lead-${index}`,
    companyName: item.title,
    address: item.address || "",
    phone: item.phone || "",
    rating: item.rating ?? 0,
    reviewCount: item.votes_count ?? 0,
    website: hasWebsite
      ? item.domain!.startsWith("http")
        ? item.domain
        : `https://${item.domain}`
      : null,
    status,
    rankAbsolute: item.rank_absolute ?? 0,
    isClaimed: item.is_claimed === true,
    bookOnlineUrl: item.book_online_url && item.book_online_url.trim() !== "" ? item.book_online_url : null,
    totalPhotos: item.total_photos ?? 0,
    isHoursMissing: item.is_hours_missing ?? false,
    isCurrentlyOpen: item.is_currently_open ?? false,
    priceLevel: item.price_level && item.price_level.trim() !== "" ? item.price_level : null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    categories: Array.isArray(item.categories) ? item.categories : [],
    mainImage: item.main_image && item.main_image.trim() !== "" ? item.main_image : null,
    isMasked: item.is_masked ?? false,
  };
}
