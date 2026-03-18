/**
 * DataForSEO のロケーションCSV（CDN）を取得し、lib/constants/locations.ts を生成するスクリプト
 * 認証不要。失敗した場合は npm run fetch-locations（.env に DATAFORSEO_* 必須）を使ってください。
 * 実行: node scripts/fetch-japan-locations-from-csv.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSV_URLS = [
  "https://cdn.dataforseo.com/v3/locations/locations_serp_google_2025_12_03.csv",
  "https://cdn.dataforseo.com/v3/locations/locations_serp_google_2025_08_05.csv",
];

function parseCsvRow(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || c === "\n" || c === "\r") {
      out.push(cur.trim());
      cur = "";
      if (c !== ",") break;
    } else {
      cur += c;
    }
  }
  if (cur !== "" || out.length > 0) out.push(cur.trim());
  return out;
}

function labelFromName(locationName) {
  if (!locationName || typeof locationName !== "string") return locationName || "";
  const first = locationName.split(",")[0]?.trim() ?? locationName;
  return first;
}

function postalLabel(name) {
  const first = labelFromName(name);
  const digits = first.replace(/\D/g, "");
  if (digits.length >= 5) {
    const a = digits.slice(0, 3);
    const b = digits.slice(3, 7);
    return `〒${a}-${b}`;
  }
  return first ? `〒${first}` : name;
}

let csvText = null;
for (const url of CSV_URLS) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (res.ok) {
      csvText = await res.text();
      console.log("取得元:", url);
      break;
    }
  } catch (e) {
    console.warn("スキップ:", url, e.message);
  }
}

if (!csvText || csvText.length < 100) {
  console.error("CSV を取得できませんでした。.env に DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD を設定し、");
  console.error("  npm run fetch-locations");
  console.error(" を実行して市区町村データを取得してください。");
  process.exit(1);
}

const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
const header = parseCsvRow(lines[0]);
const codeIdx = header.findIndex((h) => /location_code/i.test(h));
const nameIdx = header.findIndex((h) => /location_name/i.test(h));
const parentIdx = header.findIndex((h) => /location_code_parent/i.test(h));
const countryIdx = header.findIndex((h) => /country_iso_code/i.test(h));
const typeIdx = header.findIndex((h) => /location_type/i.test(h));

if ([codeIdx, nameIdx, countryIdx].some((i) => i === -1)) {
  console.error("CSV の列が想定と異なります:", header);
  process.exit(1);
}

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const cells = parseCsvRow(lines[i]);
  const country = (cells[countryIdx] || "").toLowerCase();
  if (country !== "jp") continue;
  const location_code = parseInt(cells[codeIdx], 10);
  const location_name = (cells[nameIdx] || "").trim();
  const location_code_parent = cells[parentIdx] != null && cells[parentIdx] !== "" ? parseInt(cells[parentIdx], 10) : null;
  const location_type = (cells[typeIdx] || "").trim();
  if (!Number.isFinite(location_code) || !location_name) continue;
  rows.push({ location_code, location_name, location_code_parent, location_type });
}

const japan = rows.find((r) => r.location_type === "Country" && r.location_code_parent == null) ?? rows.find((r) => !r.location_code_parent);
const japanCode = japan?.location_code ?? null;
const prefectures = japanCode != null ? rows.filter((r) => r.location_code_parent === japanCode) : rows.filter((r) => r.location_type === "State" || r.location_type === "Administrative Area");
const prefectureCodes = new Set(prefectures.map((p) => p.location_code));
const allChildren = rows.filter((r) => r.location_code_parent != null && prefectureCodes.has(r.location_code_parent));
const isPostalCode = (r) => (r.location_type || "").toLowerCase().includes("postal");
const cities = allChildren.filter((r) => !isPostalCode(r));
const postalEntries = allChildren.filter(isPostalCode);

const parentToCities = new Map();
for (const c of cities) {
  const parent = c.location_code_parent;
  if (!parentToCities.has(parent)) parentToCities.set(parent, []);
  parentToCities.get(parent).push({ location_code: c.location_code, location_name: c.location_name, label: labelFromName(c.location_name) });
}
const parentToPostal = new Map();
for (const p of postalEntries) {
  const parent = p.location_code_parent;
  if (!parentToPostal.has(parent)) parentToPostal.set(parent, []);
  parentToPostal.get(parent).push({ location_code: p.location_code, location_name: p.location_name, label: postalLabel(p.location_name) });
}

const JAPAN_LOCATIONS = {};
const JAPAN_POSTAL_CODES = {};
for (const pref of prefectures) {
  const prefectureName = pref.location_name || String(pref.location_code);
  JAPAN_LOCATIONS[prefectureName] = parentToCities.get(pref.location_code) || [];
  JAPAN_POSTAL_CODES[prefectureName] = parentToPostal.get(pref.location_code) || [];
}

const prefectureKeys = Object.keys(JAPAN_LOCATIONS).sort();
if (prefectureKeys.length === 0) {
  console.error("日本の都道府県が0件でした。npm run fetch-locations を試してください。");
  process.exit(1);
}

const outPath = path.join(__dirname, "..", "lib", "constants", "locations.ts");
const out = `/**
 * 地域選択用データ（都道府県 → 市区町村 / 郵便番号）
 * 再生成: node scripts/fetch-japan-locations-from-csv.mjs または npm run fetch-locations
 */
export type City = {
  location_code: number;
  location_name: string;
  label?: string;
};

export type PostalItem = {
  location_code: number;
  location_name: string;
  label?: string;
};

/** 都道府県 → 市区町村（DataForSEO の地域検索用） */
export const JAPAN_LOCATIONS: Record<string, City[]> = ${JSON.stringify(JAPAN_LOCATIONS, null, 2)};

/** 都道府県 → 郵便番号エリア */
export const JAPAN_POSTAL_CODES: Record<string, PostalItem[]> = ${JSON.stringify(JAPAN_POSTAL_CODES, null, 2)};
`;

fs.writeFileSync(outPath, out, "utf-8");
console.log("都道府県数:", prefectureKeys.length);
console.log("市区町村数:", cities.length);
console.log("郵便番号数:", postalEntries.length);
console.log("書き出し先:", outPath);
console.log("完了しました。");
