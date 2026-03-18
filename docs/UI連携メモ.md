# UI フォルダと内部アプリの連携メモ

## 実施した対応

1. **tsconfig.json**
   - `@/UI/*` を `./UI/*` に解決するパスエイリアスを追加
   - `UI` フォルダを `exclude` に追加（後述の理由）

2. **メインアプリに追加した依存**
   - `lucide-react` … UI のアイコン用
   - `@radix-ui/react-checkbox`, `@radix-ui/react-label` … SearchSidebar のチェックボックス・ラベル用
   - `next-themes` … UI の theme-provider が参照（現状メインでは未使用だが、TS 対象にするために必要にした場合は利用）

3. **メインアプリに追加したコンポーネント**
   - `components/ui/card.tsx` … UI の Card をコピー（SearchSidebar, SummaryCards で使用）
   - `components/ui/checkbox.tsx` … UI の Checkbox をコピー（Radix 使用）
   - `components/ui/label.tsx` … UI の Label をコピー（Radix 使用）

4. **app/page.tsx**
   - `SearchSidebar`, `SummaryCards`, `LeadsTable` を `@/UI/components/...` から利用
   - `/api/leads` を呼び出し、`LeadItem` を UI の `Lead` 型に変換する `mapLeadItemToLead` で連結
   - ローディング時は SearchSidebar の「リストを抽出」を無効化（`loading` プロパティを追加）

5. **UI/components/search-sidebar.tsx**
   - オプションの `loading?: boolean` を追加し、検索中はボタンを無効化して「取得中...」表示

---

## 対応上の注意点（対応問題）

### 1. TypeScript で `UI` を exclude している

- **理由**: UI フォルダ内の多くのファイルが `@radix-ui/react-accordion` など、メインアプリに入れていないパッケージを参照しており、`UI` を include したままにすると型エラーでビルドできないため。
- **影響**: UI 内のコンポーネント（search-sidebar, leads-table, summary-cards 含む）は、メインプロジェクトの TypeScript の型チェック対象外になる。実行時・ビルド時のバンドルは Next が行うため、動きは問題ない。
- **必要なら**: UI を使う部分だけ型を厳しくしたい場合は、(A) メインに必要な Radix 系を揃える、(B) 使用する 3 コンポーネントだけメインの `components/` にコピーして `UI` を参照しない構成にする、のどちらかで対応可能。

### 2. UI の `app/` は未使用

- `UI/app/layout.tsx` や `UI/app/page.tsx` はメインアプリでは使っていない（`app/page.tsx` はルートの `app/page.tsx` のみ使用）。
- `UI` を exclude しているため、`@vercel/analytics` など UI の layout が参照するモジュールはメインに不要。

### 3. コンポーネントの二重管理

- Card / Checkbox / Label は「メインの `components/ui/`」と「UI の `components/ui/`」の両方に存在。
- メインのページは `@/UI/components/search-sidebar` 経由で UI を使い、SearchSidebar 内の `@/components/ui/...` は**メイン側**の `components/ui` を参照するため、メイン側に上記 3 つをコピーしてある。UI フォルダ内の `components/ui` は今回の連携では参照されない。

---

## 改善するとよい点

1. **型の一元化**
   - `Lead` 型は現在 `UI/components/leads-table.tsx` で export。API の `LeadItem` は `app/api/leads/route.ts`。
   - 将来的に `types/lead.ts` などで 1 つにまとめ、API と UI の両方で import すると、変換ロジックと型のずれを防ぎやすい。

2. **エラーの UX**
   - 検索失敗時は画面上部にテキストで表示しているだけ。トーストやモーダルにすると、サイドバーやテーブルに隠れにくくなる。

3. **ローディング表示**
   - 検索中は「検索中...」とボタン無効のみ。テーブルエリアにスケルトンやスピナーを出せると、待ち時間の体感が良くなる。

4. **CSV エクスポート**
   - 現在はブラウザ側で CSV を組み立ててダウンロード。項目にカンマや改行が含まれる場合はダブルクォートのエスケープを強化すると安全（現状も `"${l.companyName}"` などで囲んでいるが、文字列内の `"` のエスケープは未対応）。

5. **フィルターの初期値**
   - 「MEO弱者のみ」「Webサイトなしのみ」は初期値 `false`。v0 のモックでは `true` だった。運用に合わせて初期値を変えるとよい。

6. **レスポンシブ**
   - サイドバーは `ml-[300px]` で左 300px 固定。スマホではサイドバーをドロワー化するなど、レイアウトの切り替えがあると使いやすい。

7. **UI フォルダの TypeScript 対象化（任意）**
   - UI を型チェック対象に戻す場合は、`UI/package.json` の依存をメインの `package.json` に取り込むか、`UI` 用の `tsconfig.json` を用意して `references` でプロジェクト参照する構成にすると、型安全を維持しやすい。

---

## 動作確認

- `npm run build` でビルド成功
- `npm run dev` で起動し、キーワード・エリアを入力して「リストを抽出」で `/api/leads` が呼ばれ、結果がテーブルとサマリーカードに表示されること
- `.env.local` に `DATAFORSEO_LOGIN` と `DATAFORSEO_PASSWORD` を設定すると、実 API でリード取得可能
