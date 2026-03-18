/**
 * DataForSEO Locations API で日本のロケーションを取得し、
 * lib/constants/locations.ts を生成するスクリプト
 * 実行: node scripts/fetch-japan-locations.mjs (要: npm install 済み、.env に DATAFORSEO_* 設定)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const login = process.env.DATAFORSEO_LOGIN;
const password = process.env.DATAFORSEO_PASSWORD;

if (!login || !password) {
  console.error("DATAFORSEO_LOGIN と DATAFORSEO_PASSWORD を .env に設定してください。");
  process.exit(1);
}

const auth = Buffer.from(`${login}:${password}`).toString("base64");

const res = await fetch("https://api.dataforseo.com/v3/serp/google/locations", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
  },
});

if (!res.ok) {
  console.error("DataForSEO API エラー:", res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
const tasks = data.tasks;
if (!Array.isArray(tasks) || tasks.length === 0) {
  console.error("レスポンスに tasks がありません");
  process.exit(1);
}

const task = tasks[0];
if (task.status_code !== 20000) {
  console.error("DataForSEO タスクエラー:", task.status_code, task.status_message);
  process.exit(1);
}

const result = task.result || [];
const jp = result.filter((r) => (r.country_iso_code || "").toLowerCase() === "jp");

if (jp.length === 0) {
  console.error("日本のロケーションが1件も見つかりませんでした");
  process.exit(1);
}

const byCode = new Map(jp.map((r) => [r.location_code, r]));

const japan = jp.find((r) => r.location_type === "Country" && r.location_code_parent == null) ?? jp.find((r) => !r.location_code_parent);
const japanCode = japan?.location_code ?? null;

const prefectures = japanCode != null ? jp.filter((r) => r.location_code_parent === japanCode) : jp.filter((r) => r.location_type === "State" || r.location_type === "Administrative Area");
const prefectureCodes = new Set(prefectures.map((p) => p.location_code));

const allChildren = jp.filter((r) => r.location_code_parent != null && prefectureCodes.has(r.location_code_parent));

const isPostalCode = (r) => (r.location_type || "").toLowerCase().includes("postal");
const cities = allChildren.filter((r) => !isPostalCode(r));
const postalEntries = allChildren.filter(isPostalCode);

const parentToCities = new Map();
for (const c of cities) {
  const parent = c.location_code_parent;
  if (!parentToCities.has(parent)) parentToCities.set(parent, []);
  parentToCities.get(parent).push(c);
}
const parentToPostal = new Map();
for (const p of postalEntries) {
  const parent = p.location_code_parent;
  if (!parentToPostal.has(parent)) parentToPostal.set(parent, []);
  parentToPostal.get(parent).push(p);
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

const JAPAN_LOCATIONS = {};
const JAPAN_POSTAL_CODES = {};
for (const pref of prefectures) {
  const prefectureName = pref.location_name || String(pref.location_code);
  const children = parentToCities.get(pref.location_code) || [];
  JAPAN_LOCATIONS[prefectureName] = children.map((c) => ({
    location_code: c.location_code,
    location_name: c.location_name,
    label: labelFromName(c.location_name),
  }));
  const postals = parentToPostal.get(pref.location_code) || [];
  JAPAN_POSTAL_CODES[prefectureName] = postals.map((p) => ({
    location_code: p.location_code,
    location_name: p.location_name,
    label: postalLabel(p.location_name),
  }));
}

const prefectureKeys = Object.keys(JAPAN_LOCATIONS).sort();

// データが空のときに上書きしない（既存の locations.ts を消さない）
if (prefectureKeys.length === 0) {
  console.error("都道府県データが0件のため、ファイルを上書きしません。既存の lib/constants/locations.ts を保持します。");
  process.exit(1);
}

const out = `/**
 * 都道府県名（DataForSEO の location_name、例: "Tokyo,Japan"）
 */
export type Prefecture = string;

/**
 * DataForSEO 用の市区町村1件（地名。郵便番号は JAPAN_POSTAL_CODES に別枠）
 */
export type City = {
  location_code: number;
  location_name: string;
  label: string;
};

/**
 * 郵便番号1件（API 送信時は location_code を使用）
 */
export type PostalItem = {
  location_code: number;
  location_name: string;
  label: string;
};

/**
 * 都道府県 → 市区町村（地名のみ。郵便番号は含まない）
 * 再取得: node scripts/fetch-japan-locations.mjs
 */
export const JAPAN_LOCATIONS: Record<Prefecture, City[]> = ${JSON.stringify(JAPAN_LOCATIONS, null, 2)};

/**
 * 都道府県 → 郵便番号リスト（別枠。UI では「郵便番号で選ぶ」で表示）
 */
export const JAPAN_POSTAL_CODES: Record<Prefecture, PostalItem[]> = ${JSON.stringify(JAPAN_POSTAL_CODES, null, 2)};
`;

const outPath = path.join(__dirname, "..", "lib", "constants", "locations.ts");
fs.writeFileSync(outPath, out, "utf-8");

console.log("都道府県数:", prefectureKeys.length);
console.log("市区町村数（地名）:", cities.length);
console.log("郵便番号数:", postalEntries.length);
console.log("書き出し先:", outPath);
console.log("完了しました。");