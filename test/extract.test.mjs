// Synthetic smoke test for the extraction pipeline (run: npm test).
// Covers the spec's main behaviors without depending on any live site.
import { JSDOM } from "jsdom";
import { extractPage } from "../src/content/extract-page.js";
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
<p><a href="/other-article"><img src="/nav-thumb.png" alt="ナビカード"></a>これは他ページへのリンクなのでリンクのまま。</p>
<p><a href="/post/images/000"><img src="/self-sub.png" alt="同一ページ配下"></a></p>
<p><img srcset="/small.jpg 480w, /large.jpg 1200w" src="/fallback.jpg" alt="srcset画像"></p>
<p>記事に<a href="/rel1">【写真】誘導リンクは消える</a>はず。</p>
<p>${longText2}</p>
</article>
</body>
</html>`;

const dom = new JSDOM(html, { url: "https://example.com/post?id=42&utm_source=news&fbclid=x" });
const result = extractPage(dom.window.document, dom.window.location);

let failed = 0;
const check = (label, cond) => {
  console.log((cond ? "PASS" : "FAIL"), label);
  if (!cond) failed++;
};

check("extraction succeeds", result.ok);
if (!result.ok) {
  console.error("reason:", result.reason);
  process.exit(1);
}
const md = result.markdown;
const lines = md.split("\n");

check("frontmatter title quoted", lines.some((l) => l.startsWith('title: "OGタイトル:')));
check("published date normalized", md.includes("published: 2026-07-10"));
check("language normalized ja-JP → ja", md.includes("language: ja"));
check("tracking params removed", md.includes("https://example.com/post?id=42") && !md.includes("utm_source") && !md.includes("fbclid"));
check("[PR] marker removed", !md.includes("[PR]"));
check("lazy img resolved via data-src", md.includes("![図のalt](https://example.com/images/real-photo.png)"));
check("alt+caption both lines", md.includes("> alt: 図のalt") && md.includes("> caption: 図1 キャプション"));
check("empty alt image kept without alt line", md.includes("![](https://example.com/decorative.png)"));
check("alt==caption collapses to caption only", md.includes("> caption: 同一テキスト") && !md.includes("> alt: 同一テキスト"));
check("in-figure photo link unwrapped", md.includes("![同一テキスト](https://example.com/same.png)"));
check("normal text link kept", md.includes("[通常のテキストリンク](https://example.com/detail)"));
check("nav-card link NOT converted to figure", !md.includes("> caption: ナビカード"));
check("same-page sub-path link rescued", md.includes("![同一ページ配下](https://example.com/self-sub.png)"));
check("srcset picks largest candidate", md.includes("(https://example.com/large.jpg)"));
check("【写真】promo link removed", !md.includes("誘導リンクは消える"));

check(
  "filename: forbidden chars to fullwidth",
  buildFilename('レビュー: 「新製品」は買い?/比較*まとめ<決定版>...', "2026-07-12") ===
    "2026-07-12_レビュー： 「新製品」は買い？／比較＊まとめ＜決定版＞.md"
);
check("filename: empty title fallback", buildFilename("  ", "2026-07-12") === "2026-07-12_untitled.md");
check("filename: length capped", buildFilename("あ".repeat(300), "2026-07-12").length <= 100);

console.log(failed === 0 ? "\nAll tests passed." : `\n${failed} test(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);
