/**
 * DataForSEO の都道府県名（location_name）→ 日本語表示用ラベル
 * キーは JAPAN_LOCATIONS のキーと一致（例: "Tokyo,Japan"）
 */
export const PREFECTURE_LABEL_JA: Record<string, string> = {
  "Hokkaido,Japan": "北海道",
  "Aomori,Japan": "青森県",
  "Iwate,Japan": "岩手県",
  "Miyagi,Japan": "宮城県",
  "Akita,Japan": "秋田県",
  "Yamagata,Japan": "山形県",
  "Fukushima,Japan": "福島県",
  "Ibaraki,Japan": "茨城県",
  "Tochigi,Japan": "栃木県",
  "Gunma,Japan": "群馬県",
  "Saitama,Japan": "埼玉県",
  "Chiba,Japan": "千葉県",
  "Tokyo,Japan": "東京都",
  "Kanagawa,Japan": "神奈川県",
  "Niigata,Japan": "新潟県",
  "Toyama,Japan": "富山県",
  "Ishikawa,Japan": "石川県",
  "Fukui,Japan": "福井県",
  "Yamanashi,Japan": "山梨県",
  "Nagano,Japan": "長野県",
  "Gifu,Japan": "岐阜県",
  "Shizuoka,Japan": "静岡県",
  "Aichi,Japan": "愛知県",
  "Mie,Japan": "三重県",
  "Shiga,Japan": "滋賀県",
  "Kyoto,Japan": "京都府",
  "Osaka,Japan": "大阪府",
  "Hyogo,Japan": "兵庫県",
  "Nara,Japan": "奈良県",
  "Wakayama,Japan": "和歌山県",
  "Tottori,Japan": "鳥取県",
  "Shimane,Japan": "島根県",
  "Okayama,Japan": "岡山県",
  "Hiroshima,Japan": "広島県",
  "Yamaguchi,Japan": "山口県",
  "Tokushima,Japan": "徳島県",
  "Kagawa,Japan": "香川県",
  "Ehime,Japan": "愛媛県",
  "Kochi,Japan": "高知県",
  "Fukuoka,Japan": "福岡県",
  "Saga,Japan": "佐賀県",
  "Nagasaki,Japan": "長崎県",
  "Kumamoto,Japan": "熊本県",
  "Oita,Japan": "大分県",
  "Miyazaki,Japan": "宮崎県",
  "Kagoshima,Japan": "鹿児島県",
  "Okinawa,Japan": "沖縄県",
};

/**
 * 都道府県キー（ローマ字）を日本語ラベルに変換。未定義の場合はそのまま返す。
 */
export function getPrefectureLabelJa(key: string): string {
  return PREFECTURE_LABEL_JA[key] ?? key;
}
