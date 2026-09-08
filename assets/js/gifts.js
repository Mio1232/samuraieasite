/* =========================================================
   プレゼント記事エンジン（ビルド不要 / data/gifts.json を読み込み）
   - gifts.html : #gift-list に一覧カードを描画
   - article.html: #gift-article に記事本文を描画（?slug=xxx）
   管理は Decap CMS(/admin) で data/gifts.json を編集
   ========================================================= */
(function () {
  "use strict";

  var LINE = "https://lin.ee/tZVy3XY";
  var ARTICLE_BASE = window.__ARTICLE_BASE__ || "article.html";

  /* ---------- 最小Markdown → HTML ---------- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inline(s) {
    // 画像 ![alt](src)
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, src) {
      var cap = alt ? '<figcaption>' + alt + '</figcaption>' : '';
      return '<figure class="figure"><img data-zoom src="' + src + '" alt="' + alt + '">' + cap + '</figure>';
    });
    // リンク [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // 太字 **text** / __text__
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    // マーカー ==text==
    s = s.replace(/==([^=]+)==/g, '<span class="hl">$1</span>');
    // 斜体 *text*
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    return s;
  }
  function md(text) {
    if (!text) return "";
    var lines = String(text).replace(/\r\n/g, "\n").split("\n");
    var out = [], i = 0;
    function flushPara(buf) {
      if (buf.length) { out.push("<p>" + inline(esc(buf.join(" "))) + "</p>"); buf.length = 0; }
    }
    var para = [];
    while (i < lines.length) {
      var line = lines[i];
      var t = line.trim();
      if (t === "") { flushPara(para); i++; continue; }
      // 画像だけの行はブロックとして（段落に包まない）
      if (/^!\[[^\]]*\]\([^)\s]+\)\s*$/.test(t)) { flushPara(para); out.push(inline(esc(t))); i++; continue; }
      // 見出し
      var h = t.match(/^(#{2,4})\s+(.*)$/);
      if (h) { flushPara(para); var lv = h[1].length; out.push("<h" + lv + ">" + inline(esc(h[2])) + "</h" + lv + ">"); i++; continue; }
      // 水平線
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { flushPara(para); out.push("<hr>"); i++; continue; }
      // 引用
      if (/^>\s?/.test(t)) {
        flushPara(para);
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) { q.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
        out.push("<blockquote>" + inline(esc(q.join(" "))) + "</blockquote>");
        continue;
      }
      // 箇条書き
      if (/^[-*]\s+/.test(t)) {
        flushPara(para);
        var ul = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { ul.push("<li>" + inline(esc(lines[i].trim().replace(/^[-*]\s+/, ""))) + "</li>"); i++; }
        out.push("<ul>" + ul.join("") + "</ul>");
        continue;
      }
      // 番号付き
      if (/^\d+\.\s+/.test(t)) {
        flushPara(para);
        var ol = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { ol.push("<li>" + inline(esc(lines[i].trim().replace(/^\d+\.\s+/, ""))) + "</li>"); i++; }
        out.push("<ol>" + ol.join("") + "</ol>");
        continue;
      }
      para.push(t); i++;
    }
    flushPara(para);
    return out.join("\n");
  }

  /* ---------- EA紹介ブロック ---------- */
  function eaBlock() {
    return '' +
      '<h2>あわせて：2つのEAという選択肢</h2>' +
      '<p>目的に合わせて、2つのEAから選べます。</p>' +
      '<div class="pr-mini lineup-card samurai" style="border-color:#1f6b40">' +
        '<span class="pr-lbl">攻め / 無料</span>' +
        '<h3 style="font-family:var(--font-disp);font-weight:800;font-size:1.3rem;margin:.3rem 0">samurai EA <span class="lineup-badge badge-free">無料</span></h3>' +
        '<p style="color:var(--text-dim);font-size:.92rem;line-height:1.9">GOLD特化のハイパフォーマンス型EA。指定リンクからの口座開設で無料でお使いいただけます。</p>' +
        '<div class="cta-row" style="margin-top:1rem"><a class="btn btn--ghost" href="account.html">無料EAの始め方を見る <span class="arw">&rarr;</span></a></div>' +
      '</div>' +
      '<div class="pr-mini lineup-card musashi" style="background:linear-gradient(180deg,rgba(34,211,238,.06),var(--bg-2))">' +
        '<span class="pr-lbl">実績重視 / 有料</span>' +
        '<h3 style="font-family:var(--font-disp);font-weight:800;font-size:1.3rem;margin:.3rem 0">ムサシEA <span class="lineup-badge badge-paid">有料</span></h3>' +
        '<p style="color:var(--text-dim);font-size:.92rem;line-height:1.9">安定した積み上げを目指す実績重視のEA。詳細・料金は公式LINEでご案内します。</p>' +
        '<div class="cta-row" style="margin-top:1rem"><a class="btn btn--ghost" href="' + LINE + '" target="_blank" rel="noopener">ムサシEAの詳細を公式LINEで聞く <span class="arw">&rarr;</span></a></div>' +
        '<p class="muted" style="font-size:.76rem;margin-top:.8rem">※個人の実績であり、将来の利益や成果を保証するものではありません。相場により損失が生じる場合があります。</p>' +
      '</div>';
  }

  /* ---------- 一覧描画 ---------- */
  function renderList(el, items) {
    var live = items.filter(function (a) { return a.published !== false; });
    live.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    if (!live.length) { el.innerHTML = '<p class="muted">現在公開中のプレゼント記事はありません。</p>'; return; }
    el.innerHTML = live.map(function (a) {
      var ended = a.status === "終了";
      var badge = ended ? '<span class="gift-badge ended">終了</span>' : '<span class="gift-badge">開催中</span>';
      var thumb = a.hero
        ? '<div class="gift-thumb"><img src="' + a.hero + '" alt="" style="width:100%;height:100%;object-fit:cover">' + badge + '</div>'
        : '<div class="gift-thumb"><span class="em">' + (a.emoji || "🎁") + '</span>' + badge + '</div>';
      return '<a class="gift-card reveal in" href="' + ARTICLE_BASE + '?slug=' + encodeURIComponent(a.slug) + '">' +
        thumb +
        '<div class="gift-body">' +
          '<span class="date">' + (a.date || "") + '</span>' +
          '<h3>' + esc(a.title || "") + '</h3>' +
          '<p>' + esc(a.summary || "") + '</p>' +
          '<span class="more">記事を読む →</span>' +
        '</div></a>';
    }).join("");
  }

  /* ---------- 記事描画 ---------- */
  function renderArticle(el, items) {
    var slug = new URLSearchParams(location.search).get("slug") || window.__FORCE_SLUG__;
    var a = items.filter(function (x) { return x.slug === slug; })[0];
    if (!a || a.published === false) {
      el.innerHTML = '<p class="eyebrow">Not found</p><h1 class="h-md">記事が見つかりませんでした</h1>' +
        '<p style="margin-top:1rem"><a class="btn btn--ghost" href="gifts.html">プレゼント一覧へ戻る</a></p>';
      return;
    }
    document.title = a.title + "｜samurai EA";
    var crumbs = '<p class="crumbs" style="margin-bottom:1.4rem"><a href="index.html">ホーム</a> / <a href="gifts.html">プレゼント</a> / ' + esc(a.title) + '</p>';
    var hero = a.hero ? '<figure class="figure wide" style="margin-top:0"><img data-zoom src="' + a.hero + '" alt="' + esc(a.title) + '"></figure>' : '';
    var meta = '<div class="art-meta"><span class="art-tag">プレゼント</span>' +
      (a.status ? '<span class="art-tag">' + esc(a.status) + '</span>' : '') +
      '<span class="date" style="font-family:var(--font-mono);font-size:.72rem;color:var(--text-faint)">' + (a.date || "") + '</span></div>';
    var oc = a.openchat || "";
    var ocBtn = oc ? '<div class="cta-row" style="margin-top:1.6rem"><a class="btn btn--primary" href="' + oc + '" target="_blank" rel="noopener">オープンチャットに参加して受け取る <span class="arw">&rarr;</span></a></div>' : '';
    el.innerHTML = crumbs +
      '<p class="eyebrow">GOLD REPORT</p>' +
      '<h1 class="h-lg" style="margin-top:.4rem">' + esc(a.title) + '</h1>' +
      meta + hero +
      '<div class="article-body">' + md(a.body) + '</div>' +
      ocBtn +
      (a.showEA === false ? "" : eaBlock()) +
      '<div class="cta-row" style="display:flex;gap:.8rem;flex-wrap:wrap;margin-top:2.2rem"><a class="btn btn--ghost" href="gifts.html">プレゼント一覧へ戻る</a></div>';
  }

  /* ---------- データ取得 ---------- */
  function getData() {
    if (window.__GIFTS_PREVIEW__) return Promise.resolve(window.__GIFTS_PREVIEW__);
    return fetch("data/gifts.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) { return (j && j.items) ? j.items : (Array.isArray(j) ? j : []); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var listEl = document.getElementById("gift-list");
    var artEl = document.getElementById("gift-article");
    if (!listEl && !artEl) return;
    getData().then(function (items) {
      if (listEl) renderList(listEl, items);
      if (artEl) renderArticle(artEl, items);
    }).catch(function () {
      var t = listEl || artEl;
      if (t) t.innerHTML = '<p class="muted">記事の読み込みに失敗しました。時間をおいて再度お試しください。</p>';
    });
  });
})();
