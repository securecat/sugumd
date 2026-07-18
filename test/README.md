# 回帰テストの書き方

`npm test` で2種類のテストが走る:

- `unit.test.mjs` — 合成HTMLによる仕様の単体テスト(通常触らない)
- `extract.test.js` — **フィクスチャ回帰テスト**。`expectations/` 内の全JSONを走査し、対応するフィクスチャHTMLに `extract()` を実行して生成Markdownを検査する

新しい問題サイトの回帰テストは **フィクスチャ1枚+期待値JSON1個** で追加できる。

## 追加の流れ

1. 対象ページでツールバーアイコンを右クリック →「**デバッグ: DOMをHTML保存**」(レンダリング後DOMが保存される。curl取得のHTMLはJS実行前なので不可)
2. 保存された `fixture_YYYY-MM-DD_<ホスト名>.html` を `test/fixtures/` へ移動
3. `test/expectations/<サイト名>.json` を作成(下のテンプレ参照)
4. `npm test` — **まず意図どおり赤になることを確認**(修正前に赤=バグを正しく捉えている証拠)
5. 抽出側を修正して緑になったら完成

## 期待値JSONの形式

```json
{
  "fixture": "fixture_2026-07-13_mainichi.jp.html",
  "url": "https://mainichi.jp/articles/20220219/k00/00m/040/068000c",
  "mustContain": [
    "本文中に必ず含まれるべき一節",
    "![",
    "画像URLの特徴的な断片"
  ],
  "mustNotContain": [
    "アクセスランキング",
    "関連記事"
  ],
  "meta": {
    "title": "期待するタイトル",
    "published": "2022-02-19",
    "language": "ja"
  }
}
```

| フィールド | 必須 | 意味 |
|---|---|---|
| `fixture` | ✓ | `test/fixtures/` 内のファイル名 |
| `url` | ✓ | 記事の実URL。相対URL解決と `source_url` 生成に使われる |
| `mustContain` | | 生成Markdownに含まれるべき文字列の配列 |
| `mustNotContain` | | 生成Markdownに含まれてはいけない文字列の配列 |
| `meta` | | メタデータの完全一致チェック。`title` / `published` / `language` / `author` を任意で指定 |

- 判定はすべて**単純な部分文字列マッチ**(正規表現ではない)
- JSONのファイル名は自由。テスト結果の表示名になる(`mainichi.json` → `ok 3 - mainichi`)

## 書くときのコツ

- **`mustContain` の本文は「リンクにならない一節」を選ぶ**。Yahoo!やanondでは本文中の単語がキーワードリンク化され、mdでは `[専大松戸](…)は快勝した` のようになるため、固有名詞を含む文はマッチに失敗しやすい。平文の一節が安全
- **ページ分割記事は1ページ目の文を使う**。ライブDOMには表示中ページしか存在しない(Yahoo!ニュース等)
- **画像は `"!["`(最低1枚ある)+「URLの特徴的な断片」の2段構え**が壊れにくい
- **`meta.title` の区切りは全角スペース(`　`)なことが多い**。半角で書いて失敗しがち。一度テストを走らせてエラーメッセージから実際の値をコピーするのが確実
- **`clipped` は書かない**(実行日で変わるため検証不可)
- 現在の各ケースの合否と経緯は [BASELINE.md](BASELINE.md) を参照
