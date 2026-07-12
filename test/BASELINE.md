# 抽出エンジン ベースライン記録

フィクスチャ回帰テスト(`npm test`)の結果記録。エンジン移行の効果測定用。

## Readability + site-specificパッチ構成(v1.0.3時点・2026-07-12)

`@mozilla/readability` 0.6 + `prepare-dom.js` の前処理パッチ群(hiddenクラス誤爆対策・リンク内画像救出・figure内リンク展開・印刷/共有UI除去 ほか)。

| ケース | 結果 | 備考 |
|---|---|---|
| yahoo-images | ✅ pass | 画像3枚+キャプション+本文。パッチ群(hidden誤爆対策・figure救出・【写真】リンク除去)前提の合格 |
| yahoo-sidebar | ✅ pass | サイドバー(ランキング等)混入なし。`<article>` 限定パッチ前提の合格 |
| asahi-figures | ✅ pass | figure内リンク展開パッチ前提の合格 |
| asahi-share | ✅ pass | 印刷/共有UI除去パッチ前提の合格 |
| anond-long | ❌ fail | 本文は取れるが、`Permalink | 記事への反応(3) | 時刻` フッターとトラックバック(他エントリの反応本文)が大量混入。本文約1,500字に対し出力12,363字 |
| anond-short | ❌ fail | 同上(本文約150字に対し出力1,237字) |

合成テスト(unit.test.mjs)25件: すべてpass。

**計: フィクスチャ 4/6 pass、全体 29/31 pass**

### 注記

- フィクスチャは拡張のデバッグ機能(レンダリング後DOM保存)で取得したもの。curl取得のHTMLとは内容が異なる(例: Yahoo!ニュースはライブDOMでは記事が**ページ分割**されており、1ページ目しかDOMに存在しない。expectationsは1ページ目の内容のみを要求している。複数ページ記事の全文クリップは抽出エンジンの問題ではなく対象外)
- anond の published は構造化メタデータがないため null(frontmatterから省略される)。これは仕様どおりでありfail要因ではない
