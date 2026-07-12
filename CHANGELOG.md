# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.2] - 2026-07-12

### Added

- Synthetic test suite for the extraction pipeline (`npm test`)

### Fixed

- Images inside a real `<figure>` whose link (and caption) are wrapped in an `<a>` — e.g. asahi.com — were dropped as "all-link" blocks; links inside `<figure>` are now unwrapped unconditionally, keeping the caption
- Ad markers like `[PR]` no longer appear in the clip

## [1.0.1] - 2026-07-12

### Fixed

- On pages where sidebar modules (rankings, paid-article promos) live in plain `<div>`s inside `<main>` — e.g. Yahoo! News — the sidebar could be clipped instead of the article body. When a page has exactly one substantial `<article>` element, extraction is now scoped to it
- Linked images are now unwrapped only when the link points to an image file or back into the same page (photo viewer), so navigation cards keep the link signals Readability needs to discard them

## [1.0.0] - 2026-07-12

### Added

- Initial release

---

# 更新履歴

## [1.0.2] - 2026-07-12

### 追加

- 抽出パイプラインのテストスイート（`npm test`）

### 修正

- 本物の `<figure>` 内で画像とキャプションが `<a>` に包まれているサイト（朝日新聞など）で、画像が「リンクだけのブロック」として削除されていた問題を修正。`<figure>` 内のリンクは無条件に展開し、キャプションも保持するように
- `[PR]` などの広告マーカーがクリップに混入しないように

## [1.0.1] - 2026-07-12

### 修正

- サイドバーのモジュール（ランキング・有料記事など）が `<aside>` ではなく `<main>` 内の `<div>` に置かれているページ（Yahoo!ニュースなど）で、本文の代わりにサイドバーがクリップされることがある問題を修正。ページ内に十分なテキストを持つ `<article>` 要素が1つだけある場合、抽出対象をそこに限定するように
- リンクに包まれた画像の展開を「画像ファイルまたは同一ページ（写真ビューア）へのリンク」の場合のみに限定。ナビゲーションカード（ランキング・関連記事）はリンクのまま残し、Readabilityが正しく除外できるように

## [1.0.0] - 2026-07-12

### 追加

- 初回リリース
