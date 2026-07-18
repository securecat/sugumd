# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.1] - 2026-07-18

### Changed

- Renumbered every release to major version 0, keeping MINOR.PATCH as-is (former 1.0.0–1.2.0 are now 0.0.0–0.2.0). The road to a true initial release still looks long, so we start over below 1.0.0. Commit messages before this point disagree with the new numbers; we accept that

## [0.2.0] - 2026-07-18

### Added

- Frame-based pages: when a same-origin frame/iframe dominates the viewport and holds the actual content (e.g. web archive viewers like megalodon.jp), extraction targets that frame's document. The frontmatter `source_url` stays the top page URL, and the fixture-capture debug menu saves the same document extraction would use

## [0.1.0] - 2026-07-13

### Changed

- Extraction engine replaced: Readability.js → [Defuddle](https://github.com/kepano/defuddle). Site-specific pre-cleaning is reduced to a documented minimum (see README); body extraction on Hatena anonymous diary improved
- Titles now drop a trailing "separator + site name" suffix (e.g. `：朝日新聞`), driven by the extracted site metadata

### Added

- Fixture-based regression test suite (`npm test`): fixtures captured from the rendered DOM, one JSON of expectations per case
- Development-only context menu on the toolbar icon to save the current tab's DOM as a test fixture (adds the `contextMenus` permission)
- `TUNING.md`: running backlog of extraction tuning targets

## [0.0.3] - 2026-07-12

### Fixed

- Print/share toolbars no longer appear in clips: elements with print-excluded classes (`notPrint`, `no-print`, `d-print-none`, …), share links (share-by-mail `mailto:?` with article-length URLs, X/Facebook/Hatena/LINE/Pocket and other share endpoints), `<button>`s, and script-only controls are removed, along with the empty list skeletons they leave behind. Contact `mailto:` links with a recipient are kept

## [0.0.2] - 2026-07-12

### Added

- Synthetic test suite for the extraction pipeline (`npm test`)

### Fixed

- Images inside a real `<figure>` whose link (and caption) are wrapped in an `<a>` — e.g. asahi.com — were dropped as "all-link" blocks; links inside `<figure>` are now unwrapped unconditionally, keeping the caption
- Ad markers like `[PR]` no longer appear in the clip

## [0.0.1] - 2026-07-12

### Fixed

- On pages where sidebar modules (rankings, paid-article promos) live in plain `<div>`s inside `<main>` — e.g. Yahoo! News — the sidebar could be clipped instead of the article body. When a page has exactly one substantial `<article>` element, extraction is now scoped to it
- Linked images are now unwrapped only when the link points to an image file or back into the same page (photo viewer), so navigation cards keep the link signals Readability needs to discard them

## [0.0.0] - 2026-07-12

### Added

- Initial release

---

# 更新履歴

## [0.2.1] - 2026-07-18

### 変更

- 真の初回リリースまでの道のりはまだ長そうだということで、MAJORバージョンを0に落として仕切り直し。全リリースのMAJORを0に振り直した（MINOR.PATCHはそのまま。旧 1.0.0〜1.2.0 は 0.0.0〜0.2.0 に）。これ以前のコミットメッセージと齟齬が起きるが気にしないものとする

## [0.2.0] - 2026-07-18

### 追加

- フレーム構造のページに対応：同一オリジンのフレーム/iframeがビューポートの大部分を占めて実コンテンツを持つ場合（megalodon.jp のようなウェブ魚拓ビューア等）、そのフレームのドキュメントを抽出対象に。frontmatter の `source_url` は親ページのURLを維持し、フィクスチャ保存デバッグメニューも抽出と同じドキュメントを保存するように

## [0.1.0] - 2026-07-13

### 変更

- 抽出エンジンを Readability.js から [Defuddle](https://github.com/kepano/defuddle) に置き換え。サイト固有の前処理を必要最小限に削減（README参照）。はてな匿名ダイアリーの本文抽出が改善
- タイトル末尾の「区切り文字+サイト名」サフィックス（例：`：朝日新聞`）を、抽出したサイト名メタデータに基づいて除去するように

### 追加

- フィクスチャベースの回帰テストスイート（`npm test`）：レンダリング後DOMから取得したフィクスチャ+ケースごとの期待値JSON
- ツールバーアイコンの右クリックに、表示中タブのDOMをテストフィクスチャとして保存する開発用メニュー（`contextMenus` 権限を追加）
- `TUNING.md`：抽出チューニング課題の随時更新リスト

## [0.0.3] - 2026-07-12

### 修正

- 印刷・共有ツールバーがクリップに混入しないように：印刷除外クラス（`notPrint`・`no-print`・`d-print-none` 等）の要素、共有リンク（記事全文入りの巨大URLになる宛先なし `mailto:?`、X/Facebook/はてブ/LINE/Pocket等のシェアエンドポイント）、`<button>`、スクリプト専用コントロールを除去し、除去後に残る空のリスト骨格も掃除するように。宛先ありの `mailto:` 連絡先リンクは維持

## [0.0.2] - 2026-07-12

### 追加

- 抽出パイプラインのテストスイート（`npm test`）

### 修正

- 本物の `<figure>` 内で画像とキャプションが `<a>` に包まれているサイト（朝日新聞など）で、画像が「リンクだけのブロック」として削除されていた問題を修正。`<figure>` 内のリンクは無条件に展開し、キャプションも保持するように
- `[PR]` などの広告マーカーがクリップに混入しないように

## [0.0.1] - 2026-07-12

### 修正

- サイドバーのモジュール（ランキング・有料記事など）が `<aside>` ではなく `<main>` 内の `<div>` に置かれているページ（Yahoo!ニュースなど）で、本文の代わりにサイドバーがクリップされることがある問題を修正。ページ内に十分なテキストを持つ `<article>` 要素が1つだけある場合、抽出対象をそこに限定するように
- リンクに包まれた画像の展開を「画像ファイルまたは同一ページ（写真ビューア）へのリンク」の場合のみに限定。ナビゲーションカード（ランキング・関連記事）はリンクのまま残し、Readabilityが正しく除外できるように

## [0.0.0] - 2026-07-12

### 追加

- 初回リリース
