/* 無料EA配布サイト — 共通スクリプト（Lenis + GSAP 対応・段階的強化） */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- モバイルナビ ---- */
  var burger = document.querySelector('.burger');
  var links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- スタッガー（時間差表示） ---- */
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    group.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.setProperty('--d', (i * 90) + 'ms');
    });
  });

  /* ---- スクロール表示（IntersectionObserver） ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- ヒーロー入場（ロード時に時間差で） ---- */
  var heroReveals = document.querySelectorAll('.hero .reveal');
  requestAnimationFrame(function () {
    heroReveals.forEach(function (el, i) {
      el.style.setProperty('--d', (i * 130) + 'ms');
      el.classList.add('in');
    });
  });

  var hasGSAP = window.gsap && window.ScrollTrigger;
  var hasLenis = typeof window.Lenis === 'function';

  /* ---- スムーススクロール（Lenis） ---- */
  var lenis = null;
  if (hasLenis && !reduced) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, smoothTouch: false });
    if (hasGSAP) {
      lenis.on('scroll', function () { window.ScrollTrigger.update(); });
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
  }

  /* ---- GSAP スクロール連動モーション ---- */
  if (hasGSAP && !reduced) {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    // ヒーロー背景の視差（コンテナのみ。オーロラ/波のCSSアニメは維持）
    var heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 20, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
    // ヒーローのコピーをゆっくり上へ抜けさせる
    var heroWrap = document.querySelector('.hero .wrap');
    if (heroWrap) {
      gsap.to(heroWrap, {
        yPercent: -12, opacity: 0.85, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
    // 特徴画像の視差
    gsap.utils.toArray('.feature-media').forEach(function (el) {
      gsap.fromTo(el, { yPercent: 7 }, {
        yPercent: -7, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    window.addEventListener('load', function () { ST.refresh(); });
  } else if (!reduced && !hasGSAP) {
    /* フォールバック：GSAP無しでも背景を軽く視差 */
    var bg = document.querySelector('.hero-bg');
    if (bg) {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            bg.style.transform = 'translateY(' + (window.scrollY * 0.12) + 'px)';
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }
})();

/* ---- 実績：カウントアップ＆チャートのスクロール描画（外部依存なし） ---- */
(function () {
  var perf = document.getElementById('perf');
  if (!perf) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ダミーの資産推移（実データに差し替え可：月次などの数値を並べる）
  var EQUITY = [100,101,100.4,102,103.5,103,105,107,106.2,108.6,110,109,112,114,113,116,118.5,117,120,123,122,126,129,128,133,137,136,141,146,145,151,157,156,163,170,169,177,185,184,193];

  var eq = document.getElementById('eqline'), area = document.getElementById('eqarea'), dot = document.getElementById('eqdot');
  var len = 0;
  if (eq) {
    var W = 800, H = 340, top = 30, bot = 305, mn = Math.min.apply(null, EQUITY), mx = Math.max.apply(null, EQUITY);
    var pts = EQUITY.map(function (v, i) { var x = i / (EQUITY.length - 1) * W; var y = bot - (v - mn) / (mx - mn || 1) * (bot - top); return [x, y]; });
    var d = "M" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L");
    eq.setAttribute('d', d);
    if (area) area.setAttribute('d', d + " L" + W + "," + H + " L0," + H + " Z");
    var last = pts[pts.length - 1]; if (dot) { dot.setAttribute('cx', last[0]); dot.setAttribute('cy', last[1]); }
    try { len = eq.getTotalLength(); } catch (e) { len = 2600; }
    eq.style.strokeDasharray = len; eq.style.strokeDashoffset = reduced ? 0 : len;
  }

  function drawChart() {
    if (!eq) return;
    if (reduced) { if (area) area.classList.add('in'); if (dot) dot.classList.add('in'); return; }
    eq.style.transition = 'none'; eq.style.strokeDashoffset = len;
    if (area) area.classList.remove('in'); if (dot) dot.classList.remove('in');
    void eq.getBoundingClientRect();
    eq.style.transition = 'stroke-dashoffset 2s cubic-bezier(.4,0,.2,1)'; eq.style.strokeDashoffset = 0;
    if (area) area.classList.add('in');
    setTimeout(function () { if (dot) dot.classList.add('in'); }, 1700);
  }

  function countUp(el) {
    var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || "0", 10),
        suffix = el.dataset.suffix || "", comma = el.dataset.comma === "1";
    function fmt(v) { return (comma ? Math.round(v).toLocaleString() : v.toFixed(dec)) + suffix; }
    if (reduced) { el.textContent = fmt(to); return; }
    var dur = 1600, t0 = null;
    function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1); var e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to); }
    requestAnimationFrame(step);
  }

  function play() { perf.querySelectorAll('[data-to]').forEach(countUp); drawChart(); }

  var fired = false;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !fired) { fired = true; play(); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(perf);
  } else { play(); }
})();
