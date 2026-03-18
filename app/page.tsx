"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, SlidersHorizontal, List, LogOut, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchSidebar, type RankFilterValue } from "@/components/features/search-sidebar";
import { SummaryCards } from "@/components/features/summary-cards";
import {
  LeadsTable,
  getDefaultVisibleColumns,
  COLUMN_CONFIG,
  COLUMN_IDS,
  type VisibleColumnsState,
  type ColumnId,
} from "@/components/features/leads-table";
import type { LeadItem, Lead } from "@/types/lead";
import { mapLeadItemToLead } from "@/types/lead";
import { quoteCsvField } from "@/lib/csv";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";

function LeadGenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState("美容室");
  const [locationCode, setLocationCode] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");
  const [depth, setDepth] = useState(10);
  const [meoWeakOnly, setMeoWeakOnly] = useState(false);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [unclaimedOnly, setUnclaimedOnly] = useState(false);
  const [noBookOnlineOnly, setNoBookOnlineOnly] = useState(false);
  const [fewPhotosOnly, setFewPhotosOnly] = useState(false);
  const [hoursMissingOnly, setHoursMissingOnly] = useState(false);
  const [currentlyOpenOnly, setCurrentlyOpenOnly] = useState(false);
  const [rankFilter, setRankFilter] = useState<RankFilterValue>("all");
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumnsState>(getDefaultVisibleColumns());
  const [loading, setLoading] = useState(false);
  const [leadItems, setLeadItems] = useState<LeadItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [headerImgError, setHeaderImgError] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
      if (user?.id) {
        supabase
          .from("users")
          .select("monthly_credits")
          .eq("id", user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data?.monthly_credits != null) {
              setCredits(Number(data.monthly_credits));
            } else {
              setCredits(null);
            }
          });
      } else {
        setCredits(null);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      if (session?.user?.id) {
        const sb = createClient();
        sb.from("users")
          .select("monthly_credits")
          .eq("id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data?.monthly_credits != null) {
              setCredits(Number(data.monthly_credits));
            } else {
              setCredits(null);
            }
          });
      } else {
        setCredits(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("決済が完了しました！プランがアップグレードされました。");
      router.replace("/");
    }
  }, [searchParams, router]);

  const leads: Lead[] = useMemo(
    () => leadItems.map(mapLeadItemToLead),
    [leadItems]
  );

  const filteredLeads = useMemo(() => {
    if (!hasSearched) return [];
    return leads.filter((lead) => {
      if (meoWeakOnly && noWebsiteOnly) {
        if (lead.status !== "meo-weak" && lead.status !== "no-website") return false;
      } else if (meoWeakOnly) {
        if (lead.status !== "meo-weak") return false;
      } else if (noWebsiteOnly) {
        if (lead.status !== "no-website") return false;
      }
      if (unclaimedOnly && lead.isClaimed) return false;
      if (noBookOnlineOnly && lead.bookOnlineUrl) return false;
      if (fewPhotosOnly && lead.totalPhotos >= 10) return false;
      if (hoursMissingOnly && !lead.isHoursMissing) return false;
      if (currentlyOpenOnly && !lead.isCurrentlyOpen) return false;
      if (rankFilter === "10" && lead.rankAbsolute <= 10) return false;
      if (rankFilter === "20" && lead.rankAbsolute <= 20) return false;
      return true;
    });
  }, [hasSearched, leads, meoWeakOnly, noWebsiteOnly, unclaimedOnly, noBookOnlineOnly, fewPhotosOnly, hoursMissingOnly, currentlyOpenOnly, rankFilter]);

  const summary = useMemo(() => {
    const total = filteredLeads.length;
    const meoWeak = filteredLeads.filter((l) => l.status === "meo-weak").length;
    const noWebsite = filteredLeads.filter((l) => l.website === null).length;
    return { total, meoWeak, noWebsite };
  }, [filteredLeads]);

  const setLocation = useCallback((code: number | null, name: string) => {
    setLocationCode(code);
    setLocationName(name);
  }, []);

  async function handleSearch() {
    if (locationCode == null) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        keyword: keyword.trim() || "美容室",
        location_code: String(locationCode),
        depth: String(depth),
      });
      const res = await fetch(`/api/leads?${params}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setLoading(false);
          router.push("/login");
          return;
        }
        if (res.status === 402) {
          toast.error("クレジットが不足しています。プランをアップグレードしてください。", {
            description: data.error ?? undefined,
          });
        } else {
          toast.error("エラーが発生しました", {
            description: data.error ?? "検索に失敗しました。",
          });
        }
        setLeadItems([]);
        return;
      }
      setLeadItems(data.leads ?? []);
      const unlockedCount = (data.leads ?? []).filter((l: { is_masked?: boolean }) => !l.is_masked).length;
      if (unlockedCount > 0) {
        setCredits((prev) => (prev !== null ? prev - unlockedCount : prev));
      }
    } catch {
      toast.error("エラーが発生しました", {
        description: "通信エラーが発生しました。",
      });
      setLeadItems([]);
    } finally {
      setLoading(false);
    }
  }

  function getLeadCsvValue(lead: Lead, columnId: ColumnId): string | number | null {
    switch (columnId) {
      case "companyName":
        return lead.companyName;
      case "address":
        return lead.address;
      case "phone":
        return lead.phone;
      case "rating":
        return lead.rating;
      case "reviewCount":
        return lead.reviewCount;
      case "website":
        return lead.website ?? "";
      case "status":
        return lead.status === "meo-weak" ? "MEO弱者" : lead.status === "no-website" ? "サイトなし" : "優良";
      case "rankAbsolute":
        return lead.rankAbsolute;
      case "latitude":
        return lead.latitude != null ? lead.latitude : "";
      case "longitude":
        return lead.longitude != null ? lead.longitude : "";
      case "categories":
        return lead.categories.length > 0 ? lead.categories.join(", ") : "";
      case "mainImage":
        return lead.mainImage ?? "";
      case "totalPhotos":
        return lead.totalPhotos;
      case "priceLevel":
        return lead.priceLevel ?? "";
      default:
        return "";
    }
  }

  function getColumnLabel(id: ColumnId): string {
    return COLUMN_CONFIG.find((c) => c.id === id)?.label ?? id;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleExport() {
    if (filteredLeads.length === 0) {
      toast.error("エクスポートするデータがありません。");
      return;
    }
    const visibleColumnIds = COLUMN_IDS.filter((id) => visibleColumns[id]);
    if (visibleColumnIds.length === 0) {
      toast.error("表示するカラムを1つ以上ONにしてください。");
      return;
    }
    const header = visibleColumnIds.map((id) => quoteCsvField(getColumnLabel(id))).join(",") + "\n";
    const rows = filteredLeads
      .map((lead) =>
        visibleColumnIds.map((id) => quoteCsvField(getLeadCsvValue(lead, id))).join(",")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${keyword}_${locationName.replace(/,/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0 bg-card">
        <div className="flex items-center gap-2">
          {headerImgError ? (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
              <List className="h-4 w-4" aria-hidden />
            </span>
          ) : (
            <img
              src="/listicon.png"
              alt="リストール"
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
              onError={() => setHeaderImgError(true)}
            />
          )}
          <span className="font-bold text-lg text-foreground">リストール</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 bg-muted px-3 py-1.5 text-sm font-medium text-foreground"
          >
            <Ticket className="h-4 w-4 shrink-0" aria-hidden />
            <span>残り {credits !== null ? credits : "…"} 件</span>
          </Badge>
          {userEmail && (
            <span className="max-w-[180px] truncate text-sm text-muted-foreground sm:max-w-[240px]">
              {userEmail}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="shrink-0"
            aria-label="ログアウト"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <SearchSidebar
          keyword={keyword}
          setKeyword={setKeyword}
          locationCode={locationCode}
          locationName={locationName}
          setLocation={setLocation}
          depth={depth}
          setDepth={setDepth}
          meoWeakOnly={meoWeakOnly}
          setMeoWeakOnly={setMeoWeakOnly}
          noWebsiteOnly={noWebsiteOnly}
          setNoWebsiteOnly={setNoWebsiteOnly}
          unclaimedOnly={unclaimedOnly}
          setUnclaimedOnly={setUnclaimedOnly}
          noBookOnlineOnly={noBookOnlineOnly}
          setNoBookOnlineOnly={setNoBookOnlineOnly}
          fewPhotosOnly={fewPhotosOnly}
          setFewPhotosOnly={setFewPhotosOnly}
          hoursMissingOnly={hoursMissingOnly}
          setHoursMissingOnly={setHoursMissingOnly}
          currentlyOpenOnly={currentlyOpenOnly}
          setCurrentlyOpenOnly={setCurrentlyOpenOnly}
          rankFilter={rankFilter}
          setRankFilter={setRankFilter}
          onSearch={handleSearch}
          loading={loading}
        />

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                抽出結果: {locationName || "エリア未選択"} × {keyword}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                検索条件に一致する営業リストを表示しています
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default" className="gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    表示項目
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>表示するカラム</DropdownMenuLabel>
                  {COLUMN_CONFIG.map(({ id, label }) => (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={visibleColumns[id]}
                      onCheckedChange={() =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          [id]: !prev[id],
                        }))
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={loading || filteredLeads.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                CSVエクスポート
              </Button>
            </div>
            </div>

            {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground mb-4">
                <span
                  className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary"
                  aria-hidden
                />
                <span>検索中...</span>
              </div>
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <div className="p-4 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            </div>
            )}

            {hasSearched && !loading && (
            <>
              <div className="mb-6">
                <SummaryCards
                  totalCount={summary.total}
                  meoWeakCount={summary.meoWeak}
                  noWebsiteCount={summary.noWebsite}
                />
              </div>
              <div>
                <LeadsTable leads={filteredLeads} visibleColumns={visibleColumns} />
              </div>
            </>
            )}

            {!hasSearched && !loading && (
            <p className="text-muted-foreground text-center py-12">
              左のサイドバーでキーワードとエリアを入力し、「リストを抽出」をクリックしてください。
            </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function LeadGenPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">読み込み中...</div>}>
      <LeadGenContent />
    </Suspense>
  );
}
