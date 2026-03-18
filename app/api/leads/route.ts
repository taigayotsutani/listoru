import { NextRequest, NextResponse } from "next/server";
import type { LeadItem } from "@/types/lead";
import { createClient } from "@/utils/supabase/server";

const DATAFORSEO_URL =
  "https://api.dataforseo.com/v3/serp/google/maps/live/advanced";

type WorkHoursTimetable = Record<string, unknown> | null;
type DataForSEOItem = {
  type?: string;
  title?: string;
  address?: string;
  address_info?: { address?: string };
  phone?: string;
  rating?: { value?: number; votes_count?: number } | null;
  domain?: string | null;
  rank_absolute?: number;
  is_claimed?: boolean;
  book_online_url?: string | null;
  total_photos?: number;
  work_hours?: { timetable?: WorkHoursTimetable; current_status?: string } | null;
  price_level?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  additional_categories?: (string | null)[] | null;
  main_image?: string | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "ログインが必要です。" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim() ?? "";
  const locationCodeParam = searchParams.get("location_code")?.trim();
  const locationCode = locationCodeParam
    ? Math.floor(Number(locationCodeParam))
    : null;
  const depthParam = searchParams.get("depth")?.trim();
  const depthNum = depthParam ? Math.floor(Number(depthParam)) : 100;
  const depth = Number.isFinite(depthNum)
    ? Math.min(700, Math.max(1, depthNum))
    : 100;

  let monthlyCredits = 0;
  const { data: userRow } = await supabase
    .from("users")
    .select("monthly_credits")
    .eq("id", user.id)
    .single();
  if (userRow?.monthly_credits != null) {
    monthlyCredits = Math.max(0, Number(userRow.monthly_credits));
  }

  if (!keyword) {
    return NextResponse.json(
      { error: "keyword は必須です。" },
      { status: 400 }
    );
  }
  if (locationCode == null || !Number.isFinite(locationCode) || locationCode < 0) {
    return NextResponse.json(
      { error: "有効なエリア（location_code）を選択してください。" },
      { status: 400 }
    );
  }

  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error("DataForSEO credentials not configured");
    return NextResponse.json(
      { error: "リストの取得中にエラーが発生しました。" },
      { status: 500 }
    );
  }

  const body = [
    {
      keyword,
      location_code: locationCode,
      language_code: "ja",
      depth,
    },
  ];

  const auth = Buffer.from(`${login}:${password}`).toString("base64");

  let res: Response;
  try {
    res = await fetch(DATAFORSEO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("DataForSEO API request failed", e);
    return NextResponse.json(
      { error: "リストの取得中にエラーが発生しました。" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("DataForSEO API error", res.status, text);
    return NextResponse.json(
      { error: "リストの取得中にエラーが発生しました。" },
      { status: 502 }
    );
  }

  let data: { tasks?: Array<{ status_code?: number; status_message?: string; result?: unknown }> };
  try {
    data = await res.json();
  } catch (e) {
    console.error("DataForSEO response parse error", e);
    return NextResponse.json(
      { error: "リストの取得中にエラーが発生しました。" },
      { status: 502 }
    );
  }

  const tasks = data.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.error("DataForSEO returned no tasks", data);
    return NextResponse.json(
      { error: "リストの取得中にエラーが発生しました。", leads: [] },
      { status: 502 }
    );
  }

  const task = tasks[0];
  const taskStatusCode = task.status_code;
  if (taskStatusCode != null && taskStatusCode !== 20000) {
    const message =
      task.status_message ?? `DataForSEO エラー (code: ${taskStatusCode})`;
    console.error("DataForSEO task error", message);
    return NextResponse.json(
      { error: "リストの取得中にエラーが発生しました。", leads: [] },
      { status: 502 }
    );
  }

  const result = task.result;
  if (!Array.isArray(result) || result.length === 0) {
    return NextResponse.json({ leads: [] });
  }

  /** 日本の国コード (+81- / +81 ) を 0 に置換して国内表記にする */
  function normalizeJapanPhone(raw: string | null | undefined): string | null {
    if (raw == null || String(raw).trim() === "") return null;
    const s = String(raw).trim();
    const normalized = s.replace(/^\+81[\s-]*/i, "0");
    return normalized === "" ? null : normalized;
  }

  const firstResult = result[0] as { items?: DataForSEOItem[] } | undefined;
  const items: DataForSEOItem[] = firstResult?.items ?? [];
  const leads: LeadItem[] = items
    .filter((item): item is DataForSEOItem => item?.type === "maps_search")
    .map((item, index) => {
      const isMasked = index >= monthlyCredits;

      const ratingValue = item.rating?.value ?? null;
      const votesCount = item.rating?.votes_count ?? null;
      const isMeoWeak =
        (votesCount !== null && votesCount < 10) ||
        (ratingValue !== null && ratingValue <= 3.5);
      const rankAbsolute = typeof item.rank_absolute === "number" ? item.rank_absolute : index + 1;
      const isClaimed = item.is_claimed === true;
      const bookOnlineUrl = item.book_online_url && String(item.book_online_url).trim() !== "" ? item.book_online_url : null;
      const totalPhotos = typeof item.total_photos === "number" ? item.total_photos : 0;

      const timetable = item.work_hours?.timetable;
      const hasTimetable =
        timetable != null &&
        typeof timetable === "object" &&
        Object.keys(timetable).length > 0;
      const isHoursMissing = !hasTimetable;
      const isCurrentlyOpen =
        (item.work_hours?.current_status ?? "").toLowerCase() === "open";

      const priceLevel =
        item.price_level && String(item.price_level).trim() !== ""
          ? item.price_level
          : null;

      const categoryList: string[] = [];
      if (item.category && String(item.category).trim() !== "") {
        categoryList.push(item.category.trim());
      }
      const additional = item.additional_categories;
      if (Array.isArray(additional)) {
        for (const c of additional) {
          if (c != null && String(c).trim() !== "") categoryList.push(String(c).trim());
        }
      }
      const categories = categoryList;

      const latitude =
        typeof item.latitude === "number" && Number.isFinite(item.latitude)
          ? item.latitude
          : null;
      const longitude =
        typeof item.longitude === "number" && Number.isFinite(item.longitude)
          ? item.longitude
          : null;
      const mainImage =
        item.main_image && String(item.main_image).trim() !== ""
          ? item.main_image
          : null;

      const fullAddress = (item.address && String(item.address).trim()) || "";
      const address = fullAddress !== "" ? fullAddress : (item.address_info?.address && String(item.address_info.address).trim()) || "";

      const phone = normalizeJapanPhone(item.phone) ?? item.phone ?? null;

      if (isMasked) {
        return {
          title: "非公開店舗 (🔒)",
          address: "",
          phone: "0**-****-****",
          rating: ratingValue,
          votes_count: votesCount,
          domain: null,
          is_meo_weak: isMeoWeak,
          rank_absolute: rankAbsolute,
          is_claimed: isClaimed,
          book_online_url: null,
          total_photos: totalPhotos,
          is_hours_missing: isHoursMissing,
          is_currently_open: isCurrentlyOpen,
          price_level: priceLevel,
          latitude,
          longitude,
          categories,
          main_image: null,
          is_masked: true,
        };
      }

      return {
        title: item.title ?? "",
        address,
        phone,
        rating: ratingValue,
        votes_count: votesCount,
        domain: item.domain ?? null,
        is_meo_weak: isMeoWeak,
        rank_absolute: rankAbsolute,
        is_claimed: isClaimed,
        book_online_url: bookOnlineUrl,
        total_photos: totalPhotos,
        is_hours_missing: isHoursMissing,
        is_currently_open: isCurrentlyOpen,
        price_level: priceLevel,
        latitude,
        longitude,
        categories,
        main_image: mainImage,
        is_masked: false,
      };
    });

  const amountToConsume = Math.min(leads.length, monthlyCredits);
  if (amountToConsume > 0) {
    const { error: rpcError } = await supabase.rpc("decrement_credits", {
      user_id: user.id,
      amount: amountToConsume,
    });

    if (rpcError) {
      console.error("decrement_credits failed", rpcError);
      return NextResponse.json(
        { error: "リストの取得中にエラーが発生しました。" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ leads });
}
