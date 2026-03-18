"use client";

import { useState } from "react";
import { Star, ExternalLink, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/types/lead";

export const COLUMN_IDS = [
  "companyName",
  "address",
  "phone",
  "rating",
  "reviewCount",
  "website",
  "status",
  "rankAbsolute",
  "latitude",
  "longitude",
  "categories",
  "mainImage",
  "totalPhotos",
  "priceLevel",
] as const;

export type ColumnId = (typeof COLUMN_IDS)[number];

export const COLUMN_CONFIG: {
  id: ColumnId;
  label: string;
  defaultVisible: boolean;
}[] = [
  { id: "companyName", label: "企業名", defaultVisible: true },
  { id: "address", label: "所在地", defaultVisible: true },
  { id: "phone", label: "電話番号", defaultVisible: true },
  { id: "rating", label: "評価", defaultVisible: true },
  { id: "reviewCount", label: "口コミ数", defaultVisible: true },
  { id: "website", label: "Webサイト", defaultVisible: true },
  { id: "status", label: "ステータス", defaultVisible: true },
  { id: "rankAbsolute", label: "MEO順位", defaultVisible: false },
  { id: "latitude", label: "緯度", defaultVisible: false },
  { id: "longitude", label: "経度", defaultVisible: false },
  { id: "categories", label: "カテゴリ", defaultVisible: false },
  { id: "mainImage", label: "メイン画像", defaultVisible: false },
  { id: "totalPhotos", label: "写真数", defaultVisible: false },
  { id: "priceLevel", label: "価格帯", defaultVisible: false },
];

export function getDefaultVisibleColumns(): Record<ColumnId, boolean> {
  return COLUMN_CONFIG.reduce(
    (acc, { id, defaultVisible }) => ({ ...acc, [id]: defaultVisible }),
    {} as Record<ColumnId, boolean>
  );
}

export type VisibleColumnsState = Record<ColumnId, boolean>;

interface LeadsTableProps {
  leads: Lead[];
  visibleColumns: VisibleColumnsState;
}

function getStatusBadge(status: Lead["status"]) {
  switch (status) {
    case "meo-weak":
      return <Badge variant="destructive">MEO弱者</Badge>;
    case "no-website":
      return <Badge variant="secondary">サイトなし</Badge>;
    case "excellent":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
          優良
        </Badge>
      );
  }
}

function StatusBadges({ lead }: { lead: Lead }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {lead.isHoursMissing && (
        <Badge variant="destructive" className="shrink-0">
          営業時間不明
        </Badge>
      )}
      {lead.isCurrentlyOpen && (
        <Badge
          variant="outline"
          className="shrink-0 border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          営業中
        </Badge>
      )}
      {!lead.isClaimed && (
        <Badge variant="destructive" className="shrink-0">
          未認証
        </Badge>
      )}
      {!lead.bookOnlineUrl && (
        <Badge variant="secondary" className="shrink-0">
          予約導線なし
        </Badge>
      )}
      {getStatusBadge(lead.status)}
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
      <span className="font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

function MainImageCell({ url }: { url: string | null }) {
  if (!url || url.trim() === "") return <span className="text-muted-foreground">-</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded border border-border overflow-hidden bg-muted hover:opacity-90"
    >
      <img
        src={url}
        alt=""
        className="size-12 object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </a>
  );
}

function renderCell(columnId: ColumnId, lead: Lead) {
  const masked = lead.isMasked === true;
  const mutedClass = masked ? "text-muted-foreground" : "";
  const lockIcon = masked ? <Lock className="inline-block w-3.5 h-3.5 shrink-0 mr-1 opacity-70" aria-hidden /> : null;

  switch (columnId) {
    case "companyName":
      return (
        <span className={masked ? "font-normal text-muted-foreground inline-flex items-center" : "font-medium"}>
          {lockIcon}
          {masked ? <span className="blur-[1px] select-none">{lead.companyName}</span> : lead.companyName}
        </span>
      );
    case "address":
      return <span className={mutedClass}>{lead.address || "-"}</span>;
    case "phone":
      return (
        <span className={`font-mono text-sm ${mutedClass} inline-flex items-center`}>
          {lockIcon}
          {lead.phone}
        </span>
      );
    case "rating":
      return <RatingStars rating={lead.rating} />;
    case "reviewCount":
      return <span>{lead.reviewCount} 件</span>;
    case "website":
      return masked ? (
        <span className="text-muted-foreground">-</span>
      ) : lead.website ? (
        <a
          href={lead.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          リンク
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    case "status":
      if (masked) return <span className="text-muted-foreground text-xs">-</span>;
      return <StatusBadges lead={lead} />;
    case "rankAbsolute":
      return <span>{lead.rankAbsolute} 位</span>;
    case "latitude":
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {lead.latitude != null ? lead.latitude.toFixed(6) : "-"}
        </span>
      );
    case "longitude":
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {lead.longitude != null ? lead.longitude.toFixed(6) : "-"}
        </span>
      );
    case "categories":
      return (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate block" title={lead.categories.join(", ")}>
          {lead.categories.length > 0 ? lead.categories.join(", ") : "-"}
        </span>
      );
    case "mainImage":
      return <MainImageCell url={lead.mainImage} />;
    case "totalPhotos":
      return <span>{lead.totalPhotos} 枚</span>;
    case "priceLevel":
      return <span className="text-muted-foreground">{lead.priceLevel ?? "-"}</span>;
    default:
      return null;
  }
}

function getColumnLabel(id: ColumnId): string {
  return COLUMN_CONFIG.find((c) => c.id === id)?.label ?? id;
}

export function LeadsTable({ leads, visibleColumns }: LeadsTableProps) {
  const visibleColumnIds = COLUMN_IDS.filter((id) => visibleColumns[id]);
  const maskedCount = leads.filter((l) => l.isMasked === true).length;
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleUpgradeClick() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "リクエストに失敗しました");
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URLを取得できませんでした");
      }
    } catch (err) {
      setCheckoutLoading(false);
      console.error(err);
      toast.error("決済画面を開けませんでした。しばらくして再試行してください。");
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative border border-border rounded-lg overflow-hidden bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {visibleColumnIds.map((id) => (
                <TableHead key={id} className="font-semibold text-foreground whitespace-nowrap">
                  {getColumnLabel(id)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className={
                  lead.isMasked
                    ? "bg-muted/20 hover:bg-muted/30 text-muted-foreground"
                    : "hover:bg-muted/30"
                }
              >
                {visibleColumnIds.map((id) => (
                  <TableCell key={id} className="whitespace-nowrap align-top">
                    {renderCell(id, lead)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {maskedCount > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col items-center justify-end pb-12 pointer-events-none"
            aria-hidden
          >
            <Button
              size="lg"
              variant="default"
              className="pointer-events-auto shadow-xl"
              onClick={handleUpgradeClick}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden />
              ) : (
                <Lock className="w-5 h-5 mr-2" aria-hidden />
              )}
              プランをアップグレードして残り{maskedCount}件をアンロック
            </Button>
            <p className="text-muted-foreground text-sm mt-4 pointer-events-none">
              ※アップグレードするとCSVダウンロードも可能になります
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
