// Synthetic unit tests for the extraction pipeline — spec behaviors that
// don't depend on any real site. Site regressions live in extract.test.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { extract, stripSiteSuffix } from "../src/content/extract-page.js";
import { buildFilename } from "../src/common/filename.js";

const longText1 = "これは本文の段落です。十分な長さがないとReadabilityが本文として認識しないため、ある程度の文章量を確保しています。".repeat(8);
const longText2 = "さらに本文が続きます。画像やテーブルを含む記事を想定したテストケースです。".repeat(10);

const html = `<!doctype html>
<html lang="ja-JP">
<head>
<title>ドキュメントタイトル | サイト名</title>
<meta property="og:title" content="OGタイトル: サブタイトル付き">
<meta property="article:published_time" content="2026-07-10T09:00:00+09:00">
</head>
<body>
<article>
<h1>テスト記事のタイトル</h1>
<p>[PR]</p>
<p>${longText1}</p>
<figure>
  <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-src="/images/real-photo.png" alt="図のalt">
  <figcaption>図1 キャプション</figcaption>
</figure>
<p><img src="/decorative.png" alt=""></p>
<figure>
  <a href="/photo/detail.html"><img src="/same.png" alt="同一テキスト"><figcaption>同一テキスト</figcaption></a>
</figure>
<p>本文中に<a href="/detail">通常のテキストリンク</a>があります。これは残るべきです。</p>
<p><a href="/other-article"><img src="/nav-thumb.png" alt="ナビカード">ナビ先タイトル</a>これは他ページへのリンクなのでリンクのまま。</p>
<p><a href="/post/images/000"><img src="/self-sub.png" alt="同一ページ配下"></a></p>
<p><img srcset="/small.jpg 480w, /large.jpg 1200w" src="/fallback.jpg" alt="srcset画像"></p>
<p>記事に<a href="/rel1">【写真】誘導リンクは消える</a>はず。</p>
<div class="notPrint">
  <ul>
    <li><a role="button" tabindex="0"><span>印刷する</span></a></li>
  </ul>
</div>
<ul class="share-tools">
  <li><a href="mailto:?subject=title&body=huge">メールでシェアする</a></li>
  <li><a href="https://x.com/intent/tweet?url=x">Xでシェアする</a></li>
  <li><a href="https://www.facebook.com/dialog/feed?link=x">Facebookでシェアする</a></li>
</ul>
<p>問い合わせは<a href="mailto:info@example.com">メール</a>まで。</p>
<p><button type="button">もっと見る</button>${longText2}</p>
</article>
</body>
</html>`;

const url = "https://example.com/post?id=42&utm_source=news&fbclid=x";
const { document } = parseHTML(html);
const result = extract(document, url);

test("synthetic: extraction succeeds", () => {
  assert.equal(result.error, undefined);
  assert.ok(result.markdown);
});

const md = result.markdown ?? "";
const cases = [
  ["frontmatter title quoted", () => assert.ok(md.split("\n").some((l) => l.startsWith('title: "OGタイトル:')))],
  ["published date normalized", () => assert.ok(md.includes("published: 2026-07-10"))],
  ["language normalized ja-JP → ja", () => assert.equal(result.meta.language, "ja")],
  ["tracking params removed", () => {
    assert.ok(md.includes("https://example.com/post?id=42"));
    assert.ok(!md.includes("utm_source") && !md.includes("fbclid"));
  }],
  ["[PR] marker removed", () => assert.ok(!md.includes("[PR]"))],
  ["lazy img resolved via data-src", () => assert.ok(md.includes("![図のalt](https://example.com/images/real-photo.png)"))],
  ["alt+caption both lines", () => assert.ok(md.includes("> alt: 図のalt") && md.includes("> caption: 図1 キャプション"))],
  ["empty alt image kept without alt line", () => assert.ok(md.includes("![](https://example.com/decorative.png)"))],
  ["alt==caption collapses to caption only", () => {
    assert.ok(md.includes("> caption: 同一テキスト"));
    assert.ok(!md.includes("> alt: 同一テキスト"));
  }],
  ["in-figure photo link unwrapped", () => assert.ok(md.includes("![同一テキスト](https://example.com/same.png)"))],
  ["normal text link kept", () => assert.ok(md.includes("[通常のテキストリンク](https://example.com/detail)"))],
  ["nav-card link NOT converted to figure", () => {
    // The link to the other page must survive; its text must not be
    // promoted to a figure caption (v1.0.1 behavior).
    assert.ok(!md.includes("> caption: ナビ先タイトル"), "nav-card text must not become a figure caption");
    assert.ok(md.includes("https://example.com/other-article"), "nav-card link target must survive");
  }],
  ["same-page sub-path link rescued", () => assert.ok(md.includes("![同一ページ配下](https://example.com/self-sub.png)"))],
  ["srcset picks largest candidate", () => assert.ok(md.includes("(https://example.com/large.jpg)"))],
  ["【写真】promo link removed", () => assert.ok(!md.includes("誘導リンクは消える"))],
  ["print-hidden block removed", () => assert.ok(!md.includes("印刷する"))],
  ["mail share link removed", () => assert.ok(!md.includes("mailto:?"))],
  ["SNS share links removed", () => assert.ok(!md.includes("シェアする"))],
  ["no empty list skeletons left", () => assert.ok(!/^-\s*$/m.test(md))],
  ["contact mailto link kept", () => assert.ok(md.includes("mailto:info@example.com"))],
  ["button removed but paragraph kept", () => {
    assert.ok(!md.includes("もっと見る"));
    assert.ok(md.includes("さらに本文が続きます"));
  }],
];
for (const [name, fn] of cases) test(`synthetic: ${name}`, fn);

test("stripSiteSuffix: separator + site removed", () => {
  assert.equal(stripSiteSuffix("記事タイトル：朝日新聞", "朝日新聞"), "記事タイトル");
  assert.equal(stripSiteSuffix("Article Title | Example News", "Example News"), "Article Title");
});
test("stripSiteSuffix: no separator → kept as-is", () => {
  assert.equal(stripSiteSuffix("私と朝日新聞", "朝日新聞"), "私と朝日新聞");
});
test("stripSiteSuffix: title equal to site → kept", () => {
  assert.equal(stripSiteSuffix("朝日新聞", "朝日新聞"), "朝日新聞");
});
test("stripSiteSuffix: unrelated site → kept", () => {
  assert.equal(stripSiteSuffix("記事タイトル（47NEWS）", "Yahoo!ニュース"), "記事タイトル（47NEWS）");
});

test("filename: forbidden chars to fullwidth", () => {
  assert.equal(
    buildFilename('レビュー: 「新製品」は買い?/比較*まとめ<決定版>...', "2026-07-12"),
    "2026-07-12_レビュー： 「新製品」は買い？／比較＊まとめ＜決定版＞.md"
  );
});
test("filename: empty title fallback", () => {
  assert.equal(buildFilename("  ", "2026-07-12"), "2026-07-12_untitled.md");
});
test("filename: length capped", () => {
  assert.ok(buildFilename("あ".repeat(300), "2026-07-12").length <= 100);
});
