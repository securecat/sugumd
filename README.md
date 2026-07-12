# sugumd

A one-click web clipper for Chrome. It extracts the main content of the current page and instantly saves it to your Downloads folder as a Markdown file with YAML frontmatter — no dialogs, no cloud, one clip = one file.

Built for workflows like Obsidian: what you clip is already a finished `.md` note.

## Features

- **One click, silent save** — press the toolbar button and the page is saved. No save-as dialog (duplicate names get `(1)` automatically)
- **Readable extraction** — uses [Defuddle](https://github.com/kepano/defuddle), the extraction engine built for Obsidian Web Clipper, plus [Turndown](https://github.com/mixmark-io/turndown) (with GFM tables) for HTML→Markdown conversion
- **YAML frontmatter** — `title` / `source_url` / `author` / `published` / `clipped` / `language`, collected from structured metadata (OGP, JSON-LD, `<time>`); keys are omitted rather than left empty
- **Clean source URLs** — tracking parameters (`utm_*`, `fbclid`, `gclid`, `yclid`, `igshid`) are stripped
- **Lazy-loaded image handling** — resolves real image URLs from `data-src` / `srcset`, and preserves `alt` / `figcaption` as quoted lines under each image
- **Clear feedback** — a badge on the toolbar icon shows the result: ✓ (green) on success, ! (red) on failure — distinct in both shape and color (per-tab, resets on reload)
- **Minimal permissions** — `activeTab`, `scripting`, `downloads` only. No host permissions, no resident content scripts, no data collection

### Output example

```markdown
---
title: Article Title
source_url: https://example.com/article
author: Author Name
published: 2026-07-10
clipped: 2026-07-12
language: en
---

Body converted to Markdown...

![diagram](https://example.com/image.png)
> alt: diagram
> caption: Figure 1 — overview
```

Files are named `YYYY-MM-DD_Page Title.md` (clip date; Windows-forbidden characters are converted to full-width equivalents).

## Installation

### Chrome Web Store

(Coming soon)

### Developer Mode (Manual Install)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the repository folder

The bundled extraction script (`dist/extract.js`) is committed, so no build step is required for manual installation.

## Usage

1. Open the page you want to clip
2. Click the sugumd icon in the toolbar
3. The Markdown file appears in your Downloads folder
   - ✓ green badge: saved successfully
   - ! red badge: extraction or saving failed (e.g. pages with no readable body, `chrome://` pages, PDF viewer). Nothing is saved on failure — no half-broken files

## Development

```
npm install
npm run build
```

This bundles `src/content/` into `dist/extract.js` (esbuild). Run it after changing any content-script source.

### DOM pre-cleaning kept alongside Defuddle

Extraction uses [Defuddle](https://github.com/kepano/defuddle). A small pre-cleaning step ([src/content/prepare-dom.js](src/content/prepare-dom.js)) remains because the regression suite goes red without it:

- **Linked-image rescue** — photos wrapped in photo-viewer links inside plain `<div>`s (e.g. Yahoo! News) are dropped by the engine unless converted to `<figure>` first; scoped to same-page/image-file links so navigation cards stay links
- **Teaser-link removal** — 【写真】/【動画】-style "see also" links common on Japanese news sites are kept by the engine as body text
- **UI-chrome removal** — print-excluded classes (`notPrint`, `d-print-none`, …), share endpoints (including recipient-less `mailto:?`), `<button>`s and script-only controls; the engine covers some real-world share widgets but not all of these
- **Ad-marker removal** — `[PR]`-style markers (site-independent post-processing)

### Fixture capture (development only)

Right-clicking the toolbar icon offers **デバッグ: DOMをHTML保存**, which downloads the rendered DOM of the current tab as `fixture_YYYY-MM-DD_<host>.html` for use as a regression-test fixture. This is a development feature (`src/background/debug-fixture.js`); remove its initialization and the `contextMenus` permission for store releases.

## Changelog

### v1.1.0 — 2026-07-13

#### Changed

- Extraction engine replaced: Readability.js → [Defuddle](https://github.com/kepano/defuddle), with site-specific pre-cleaning reduced to a documented minimum
- Titles now drop trailing "separator + site name" suffixes (e.g. `：朝日新聞`)

#### Added

- Fixture-based regression test suite (`npm test`) and a development-only fixture-capture context menu
- `TUNING.md` backlog of extraction tuning targets

See [CHANGELOG.md](CHANGELOG.md) for full history.

---

# すぐmd

ワンクリックで、表示中のページ本文を frontmatter 付き Markdown としてダウンロードフォルダへ即保存する Chrome 拡張です。ダイアログなし・クラウドなし・1クリップ=1ファイル。

Obsidian などへの取り込みを想定していて、クリップした時点で完成した `.md` ノートになります。

## 特徴

- **ワンクリック・無音保存** — ツールバーのボタンを押すだけで保存完了。保存ダイアログは出ません（同名時は自動で `(1)` を付与）
- **高精度な本文抽出** — Obsidian Web Clipper 向けに開発された抽出エンジン [Defuddle](https://github.com/kepano/defuddle) で本文を抽出し、[Turndown](https://github.com/mixmark-io/turndown)（GFM テーブル対応）で Markdown に変換
- **YAML frontmatter** — `title` / `source_url` / `author` / `published` / `clipped` / `language` を OGP・JSON-LD・`<time>` などの構造化メタデータから取得。取得できなかったキーは空値ではなく行ごと省略
- **URLのクリーンアップ** — 追跡系パラメータ（`utm_*`、`fbclid`、`gclid`、`yclid`、`igshid`）を除去
- **遅延読み込み画像対応** — `data-src` / `srcset` から実URLを解決し、`alt` / `figcaption` を画像直下の引用行として保持
- **わかりやすいフィードバック** — ツールバーアイコン上のバッジで結果を表示：成功は ✓（緑）、失敗は !（赤）と、形状・色の両方で区別（タブ単位・リロードで復帰）
- **最小限の権限** — `activeTab`・`scripting`・`downloads` のみ。ホスト権限なし・常駐スクリプトなし・データ収集なし

### 出力例

```markdown
---
title: 記事タイトル
source_url: https://example.com/article
author: 著者名
published: 2026-07-10
clipped: 2026-07-12
language: ja
---

Markdown化された本文…

![図版](https://example.com/image.png)
> alt: 図版
> caption: 図1 — 全体像
```

ファイル名は `YYYY-MM-DD_ページタイトル.md`（日付はクリップ日。Windows 禁止文字は全角に置換されます）。

## インストール

### Chrome ウェブストア

準備中

### デベロッパーモード（手動インストール）

1. このリポジトリをダウンロードまたはクローン
2. Chromeで `chrome://extensions` を開く
3. 右上の **デベロッパーモード** を有効にする
4. **パッケージ化されていない拡張機能を読み込む** をクリックし、リポジトリのフォルダを選択

バンドル済みの抽出スクリプト（`dist/extract.js`）はコミットされているため、手動インストールにビルドは不要です。

## 使い方

1. クリップしたいページを開く
2. ツールバーの すぐmd アイコンをクリック
3. ダウンロードフォルダに Markdown ファイルが保存されます
   - ✓ 緑バッジ：保存成功
   - ! 赤バッジ：抽出または保存に失敗（本文のないページ、`chrome://` ページ、PDFビューアなど）。失敗時は何も保存されません — 中途半端なファイルは作りません

## 開発

```
npm install
npm run build
```

`src/content/` を `dist/extract.js` にバンドルします（esbuild）。content script のソースを変更したら実行してください。

### Defuddle と併用しているDOM前処理

本文抽出は [Defuddle](https://github.com/kepano/defuddle) を使用しています。以下の前処理（[src/content/prepare-dom.js](src/content/prepare-dom.js)）は、外すと回帰テストが赤になるため維持しています：

- **リンク内画像の救出** — 素の `<div>` 構造で写真ページへのリンクに包まれた画像（Yahoo!ニュース等）はエンジンに削除されるため、先に `<figure>` へ変換。ナビカードを巻き込まないよう「同一ページ/画像ファイルへのリンク」に限定
- **誘導リンク除去** — 日本のニュースサイトに多い「【写真】〜」「【動画】〜」型のリンクはエンジンが本文として残すため除去
- **UIクローム除去** — 印刷除外クラス（`notPrint`・`d-print-none` 等）、シェアエンドポイント（宛先なし `mailto:?` を含む）、`<button>`、スクリプト専用コントロール。エンジンの内蔵セレクタは実サイトの多くをカバーするが全部ではない
- **広告マーカー除去** — `[PR]` 等（サイト非依存の後処理）

### フィクスチャ保存（開発用）

ツールバーアイコンの右クリックメニュー **デバッグ: DOMをHTML保存** で、表示中タブのレンダリング後DOMを `fixture_YYYY-MM-DD_<ホスト名>.html` としてダウンロードできます（回帰テストのフィクスチャ用）。開発用機能です（`src/background/debug-fixture.js`）。ストア公開時は初期化呼び出しと `contextMenus` 権限を外してください。

## 更新履歴

### v1.1.0 — 2026-07-13

#### 変更

- 抽出エンジンを Readability.js から [Defuddle](https://github.com/kepano/defuddle) に置き換え。サイト固有の前処理を必要最小限に削減
- タイトル末尾の「区切り文字+サイト名」サフィックス（例：`：朝日新聞`）を除去するように

#### 追加

- フィクスチャベースの回帰テストスイート（`npm test`）と開発用フィクスチャ保存メニュー
- 抽出チューニング課題リスト `TUNING.md`

全履歴は [CHANGELOG.md](CHANGELOG.md) を参照。
