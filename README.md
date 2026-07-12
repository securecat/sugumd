# sugumd

A one-click web clipper for Chrome. It extracts the main content of the current page and instantly saves it to your Downloads folder as a Markdown file with YAML frontmatter — no dialogs, no cloud, one clip = one file.

Built for workflows like Obsidian: what you clip is already a finished `.md` note.

## Features

- **One click, silent save** — press the toolbar button and the page is saved. No save-as dialog (duplicate names get `(1)` automatically)
- **Readable extraction** — uses [Readability.js](https://github.com/mozilla/readability), the same engine as Firefox Reader View, plus [Turndown](https://github.com/mixmark-io/turndown) (with GFM tables) for HTML→Markdown conversion
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

## Changelog

### v1.0.2 — 2026-07-12

#### Added

- Synthetic test suite for the extraction pipeline (`npm test`)

#### Fixed

- Images inside a real `<figure>` whose link and caption are wrapped in an `<a>` (e.g. asahi.com) were dropped; they are now kept with their captions
- Ad markers like `[PR]` no longer appear in the clip

See [CHANGELOG.md](CHANGELOG.md) for full history.

## License

[MIT](LICENSE)

---

# すぐmd

ワンクリックで、表示中のページ本文を frontmatter 付き Markdown としてダウンロードフォルダへ即保存する Chrome 拡張です。ダイアログなし・クラウドなし・1クリップ=1ファイル。

Obsidian などへの取り込みを想定していて、クリップした時点で完成した `.md` ノートになります。

## 特徴

- **ワンクリック・無音保存** — ツールバーのボタンを押すだけで保存完了。保存ダイアログは出ません（同名時は自動で `(1)` を付与）
- **高精度な本文抽出** — Firefox リーダービューと同じ [Readability.js](https://github.com/mozilla/readability) で本文を抽出し、[Turndown](https://github.com/mixmark-io/turndown)（GFM テーブル対応）で Markdown に変換
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

## 更新履歴

### v1.0.2 — 2026-07-12

#### 追加

- 抽出パイプラインのテストスイート（`npm test`）

#### 修正

- 本物の `<figure>` 内で画像とキャプションが `<a>` に包まれているサイト（朝日新聞など）で画像が消えていた問題を修正。キャプションごと保持するように
- `[PR]` などの広告マーカーがクリップに混入しないように

全履歴は [CHANGELOG.md](CHANGELOG.md) を参照。

## ライセンス

[MIT](LICENSE)
