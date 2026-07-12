# 抽出エンジン ベースライン記録

フィクスチャ回帰テスト(`npm test`)の結果記録。エンジン移行の効果測定用。

## Defuddle 移行後(2026-07-13)

`defuddle` 0.19.1(coreバンドル)+ prepare-dom.js のパッチ群は移行時点では全部残置(削減はフェーズ④)。タイトルの「区切り文字+サイト名」サフィックス除去を追加(Defuddleの `site` メタデータ駆動・site-specificではない。Readabilityが内蔵していた同種処理の代替)。

| ケース | Readability | Defuddle | 備考 |
|---|---|---|---|
| yahoo-images | ✅ | ✅ | |
| yahoo-sidebar | ✅ | ✅ | |
| asahi-figures | ✅ | ✅ | Defuddleのtitleは「：朝日新聞」付き → サフィックス除去で解消 |
| asahi-share | ✅ | ✅ | 同上 |
| anond-long | ❌ | ❌ | **本文はクリーンに取れるように改善**(Readability時代は取れていたが構造が乱れがちだった)。「記事への反応」(トラックバック)混入は残存 |
| anond-short | ❌ | ❌ | 同上 |

**計: フィクスチャ 4/6 pass、全体 33/35 pass**(Readability時代と同水準、退行なし。anondは中身が前進)

### テスト環境の注記(同一コードパス原則の差異)

- テスト用DOMは **linkedom**(jsdomから変更)。jsdomのセレクタエンジン(nwsapi)がDefuddleの使う `:not(:has(source))` 等を解釈できず、Defuddleがエラー→body全体を返すフォールバックに落ちて正しく評価できないため。Defuddleはlinkedom互換レイヤーを同梱しており、`defuddle/node` も使わず**拡張と同じcoreバンドル+linkedomのdocument**で `extract()` を呼んでいる(同一コードパス原則は維持)
- 開発環境は **Node 22**(linkedom 0.18.13 の依存が Node 20.19+ を要求するため。Node 20.17 で作業する場合は linkedom を 0.18.5 に下げる必要がある)

## Readability + site-specificパッチ構成(v1.0.3時点・2026-07-12)

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
