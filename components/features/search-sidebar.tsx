"use client";

import { useState } from "react";
import { Search, MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JAPAN_LOCATIONS, JAPAN_POSTAL_CODES } from "@/lib/constants/locations";
import type { City, PostalItem } from "@/lib/constants/locations";
import { getPrefectureLabelJa } from "@/lib/constants/prefecture-ja";

const PREFECTURE_KEYS = Object.keys(JAPAN_LOCATIONS) as (keyof typeof JAPAN_LOCATIONS)[];
type LocationMode = "area" | "postal";

export type RankFilterValue = "all" | "10" | "20";

interface SearchSidebarProps {
  keyword: string;
  setKeyword: (value: string) => void;
  locationCode: number | null;
  locationName: string;
  setLocation: (code: number | null, name: string) => void;
  depth: number;
  setDepth: (value: number) => void;
  meoWeakOnly: boolean;
  setMeoWeakOnly: (value: boolean) => void;
  noWebsiteOnly: boolean;
  setNoWebsiteOnly: (value: boolean) => void;
  unclaimedOnly: boolean;
  setUnclaimedOnly: (value: boolean) => void;
  noBookOnlineOnly: boolean;
  setNoBookOnlineOnly: (value: boolean) => void;
  fewPhotosOnly: boolean;
  setFewPhotosOnly: (value: boolean) => void;
  hoursMissingOnly: boolean;
  setHoursMissingOnly: (value: boolean) => void;
  currentlyOpenOnly: boolean;
  setCurrentlyOpenOnly: (value: boolean) => void;
  rankFilter: RankFilterValue;
  setRankFilter: (value: RankFilterValue) => void;
  onSearch: () => void;
  loading?: boolean;
}

export function SearchSidebar({
  keyword,
  setKeyword,
  locationCode,
  locationName,
  setLocation,
  depth,
  setDepth,
  meoWeakOnly,
  setMeoWeakOnly,
  noWebsiteOnly,
  setNoWebsiteOnly,
  unclaimedOnly,
  setUnclaimedOnly,
  noBookOnlineOnly,
  setNoBookOnlineOnly,
  fewPhotosOnly,
  setFewPhotosOnly,
  hoursMissingOnly,
  setHoursMissingOnly,
  currentlyOpenOnly,
  setCurrentlyOpenOnly,
  rankFilter,
  setRankFilter,
  onSearch,
  loading = false,
}: SearchSidebarProps) {
  const [locationMode, setLocationMode] = useState<LocationMode>("area");
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>("");
  const [selectedCityCode, setSelectedCityCode] = useState<string>("");

  const cities: City[] = selectedPrefecture
    ? (JAPAN_LOCATIONS[selectedPrefecture as keyof typeof JAPAN_LOCATIONS] ?? [])
    : [];
  const postalItems: PostalItem[] = selectedPrefecture
    ? (JAPAN_POSTAL_CODES[selectedPrefecture as keyof typeof JAPAN_POSTAL_CODES] ?? [])
    : [];

  const handlePrefectureChange = (value: string | null) => {
    const v = value ?? "";
    setSelectedPrefecture(v);
    setSelectedCityCode("");
    setLocation(null, "");
  };

  const handleCityChange = (value: string | null) => {
    if (value == null) return;
    const code = Number(value);
    const city = cities.find((c) => c.location_code === code);
    if (city) {
      setSelectedCityCode(value);
      setLocation(city.location_code, city.location_name);
    }
  };

  const handlePostalChange = (value: string | null) => {
    if (value == null) return;
    const code = Number(value);
    const item = postalItems.find((p) => p.location_code === code);
    if (item) {
      setSelectedCityCode(value);
      setLocation(item.location_code, item.location_name);
    }
  };

  const handleModeChange = (mode: LocationMode) => {
    setLocationMode(mode);
    setSelectedPrefecture("");
    setSelectedCityCode("");
    setLocation(null, "");
  };

  return (
    <aside className="w-[300px] shrink-0 flex flex-col bg-card border-r border-border min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              リスト検索
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyword" className="text-sm font-medium">
                キーワード
              </Label>
              <Input
                id="keyword"
                placeholder="例: 美容室、税理士"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <div className="flex gap-1 p-0.5 rounded-lg bg-muted">
                <button
                  type="button"
                  onClick={() => handleModeChange("area")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${locationMode === "area" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <MapPin className="size-3.5" />
                  地域
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("postal")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${locationMode === "postal" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Mail className="size-3.5" />
                  郵便番号
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">都道府県</Label>
              <Select
                value={selectedPrefecture}
                onValueChange={handlePrefectureChange}
              >
                <SelectTrigger className="w-full bg-background data-[placeholder]:text-muted-foreground">
                  <SelectValue placeholder="都道府県を選択" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  {PREFECTURE_KEYS.map((pref) => (
                    <SelectItem key={pref} value={pref}>
                      {getPrefectureLabelJa(pref)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {locationMode === "area" ? "市区町村" : "郵便番号"}
              </Label>
              {locationMode === "area" ? (
                <Select
                  value={selectedCityCode}
                  onValueChange={handleCityChange}
                  disabled={!selectedPrefecture}
                >
                  <SelectTrigger className="w-full bg-background data-[placeholder]:text-muted-foreground">
                    <SelectValue
                      placeholder={
                        selectedPrefecture
                          ? "市区町村を選択"
                          : "都道府県を先に選択"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {cities.map((city) => (
                      <SelectItem
                        key={city.location_code}
                        value={String(city.location_code)}
                      >
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={selectedCityCode}
                  onValueChange={handlePostalChange}
                  disabled={!selectedPrefecture}
                >
                  <SelectTrigger className="w-full bg-background data-[placeholder]:text-muted-foreground">
                    <SelectValue
                      placeholder={
                        selectedPrefecture
                          ? "郵便番号を選択"
                          : "都道府県を先に選択"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {postalItems.map((item) => (
                      <SelectItem
                        key={item.location_code}
                        value={String(item.location_code)}
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="depth" className="text-sm font-medium">
                取得件数
              </Label>
              <Input
                id="depth"
                type="number"
                min={1}
                max={700}
                placeholder="例: 10（テスト用）"
                value={depth === 100 ? "" : depth}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setDepth(100);
                    return;
                  }
                  const n = Math.floor(Number(v));
                  if (!Number.isFinite(n)) return;
                  setDepth(Math.min(700, Math.max(1, n)));
                }}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                1〜700件。未入力時は100件。テスト時は少なめにどうぞ。
              </p>
            </div>

            <Button
              className="w-full mt-2"
              onClick={onSearch}
              disabled={loading || locationCode == null}
            >
              {loading ? (
                <>
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground mr-2 inline-block"
                    aria-hidden
                  />
                  取得中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  リストを抽出
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-4 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              フィルター
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 mb-3">
              <Label className="text-sm font-medium">MEO順位で絞る</Label>
              <Select
                value={rankFilter}
                onValueChange={(v) => setRankFilter((v as RankFilterValue) || "all")}
              >
                <SelectTrigger className="w-full bg-background data-[placeholder]:text-muted-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="10">10位以下（11位〜）</SelectItem>
                  <SelectItem value="20">20位以下（21位〜）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Accordion type="multiple" defaultValue={["basics", "advanced"]} className="rounded-lg border border-border">
              <AccordionItem value="basics" className="px-3">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                  【基本フィルター】The Basics
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-0">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="meo-weak"
                      checked={meoWeakOnly}
                      onCheckedChange={(c) => setMeoWeakOnly(c === true)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="meo-weak" className="text-sm font-medium cursor-pointer">
                        MEO弱者のみ
                      </Label>
                      <p className="text-xs text-muted-foreground">口コミ10件未満 or 評価3.5以下</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="no-website"
                      checked={noWebsiteOnly}
                      onCheckedChange={(c) => setNoWebsiteOnly(c === true)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="no-website" className="text-sm font-medium cursor-pointer">
                        Webサイトなし
                      </Label>
                      <p className="text-xs text-muted-foreground">ホームページ未設定の店舗</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="few-photos"
                      checked={fewPhotosOnly}
                      onCheckedChange={(c) => setFewPhotosOnly(c === true)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="few-photos" className="text-sm font-medium cursor-pointer">
                        写真10枚未満
                      </Label>
                      <p className="text-xs text-muted-foreground">掲載写真が少ない店舗</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced" className="px-3">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                  【営業特化フィルター】Advanced
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-0">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="unclaimed"
                      checked={unclaimedOnly}
                      onCheckedChange={(c) => setUnclaimedOnly(c === true)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="unclaimed" className="text-sm font-medium cursor-pointer">
                        オーナー未認証
                      </Label>
                      <p className="text-xs text-muted-foreground">GMB 未認証の店舗</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="no-book-online"
                      checked={noBookOnlineOnly}
                      onCheckedChange={(c) => setNoBookOnlineOnly(c === true)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="no-book-online" className="text-sm font-medium cursor-pointer">
                        ネット予約URLなし
                      </Label>
                      <p className="text-xs text-muted-foreground">予約導線が未設定の店舗</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="hours-missing"
                      checked={hoursMissingOnly}
                      onCheckedChange={(c) => setHoursMissingOnly(c === true)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="hours-missing" className="text-sm font-medium cursor-pointer">
                        営業時間未設定
                      </Label>
                      <p className="text-xs text-muted-foreground">営業時間が未設定の店舗</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="currently-open"
                      checked={currentlyOpenOnly}
                      onCheckedChange={(c) => setCurrentlyOpenOnly(c === true)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="currently-open" className="text-sm font-medium cursor-pointer">
                        現在営業中
                      </Label>
                      <p className="text-xs text-muted-foreground">今開いている店舗</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          リストール v1.0
        </p>
      </div>
    </aside>
  );
}
