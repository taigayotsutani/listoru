/**
 * CSV の1フィールドをエスケープする。
 * 値をダブルクォーテーションで囲み、内部のダブルクォーテーションは "" に置換する。
 * カンマ・改行・ダブルクォーテーションを含む場合は必ずクォートする。
 */
export function escapeCsvField(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  const needsQuote = /[",\r\n]/.test(s);
  if (!needsQuote) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * CSV 用に必ずダブルクォーテーションで囲み、内部の " は "" にエスケープする。
 * 出力と表示列の整合性を保つために使用する。
 */
export function quoteCsvField(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}
