# sugumd (すぐmd)

表示中のページ本文を抽出し、frontmatter付きMarkdownとしてダウンロードフォルダへ即保存するChrome拡張。
仕様の詳細は `work/sugumd-spec.md`（gitignore対象・ローカルのみ）を参照。

## 名称ルール

- グローバル向けプロダクトのため、名称は原則 **sugumd**（manifest・ストア・README英語セクション等）
- **すぐmd** と名乗るのは README.md の日本語セクションのみ

## ビルド

- `npm install` → `npm run build` で `src/content/` を `dist/extract.js` にバンドルする（esbuild）
- `dist/extract.js` はビルド成果物だが、「Load unpacked」でそのまま動くよう**コミット対象**とする
- `src/content/` を変更したら必ず `npm run build` を実行し、`dist/` も一緒にコミットすること

## バージョン管理

- バージョン記載箇所：`manifest.json` の `version`（`package.json` の `version` も同期させること）
- 更新のたびに semver に従ってバージョンを上げること
- 変更内容は以下の2箇所に記載すること：

### CHANGELOG.md（全履歴）

- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 形式に従うこと（ただし `[Unreleased]` セクションは使わない）
- 英語セクション → `---` → 日本語セクションの構成
- バージョン見出し形式：`## [1.2.0] - 2026-05-28`
- 変更は `###` 見出しでカテゴリ別に記載すること
  - 英語セクション：`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`
  - 日本語セクション：`追加` / `変更` / `非推奨` / `削除` / `修正` / `セキュリティ`

### README.md（最新バージョンのみ）

- Changelog セクション（日本語は 更新履歴 セクション）に**最新バージョンのみ**記載すること
- 形式：`### v1.2.0 — 2026-05-28`
- 古いバージョンの記載は不要（CHANGELOG.md へのリンクで補完済み）
