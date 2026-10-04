(function () {
  "use strict";
  var c = (typeof content !== "undefined") ? content : {};
  if (typeof content === "undefined") console.error("content.js не загрузился: проверь имя файла и что он лежит рядом с index.html");

  var app = document.getElementById("app");
  var fine = matchMedia("(pointer: fine)").matches;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) {}
    return null;
  }
  function words(parent, text) {
    text.split(/\s+/).forEach(function (w, i) {
      var s = el("span", "wd", w);
      s.style.setProperty("--d", Math.min(i * 28, 900));
      parent.appendChild(s);
      parent.appendChild(document.createTextNode(" "));
    });
  }
  function figure(media, caption, isImg) {
    var f = el("figure", "media");
    var fr = el("div", "frame");
    fr.appendChild(media);
    f.appendChild(fr);
    if (caption) f.appendChild(el("figcaption", "", caption));
    if (isImg && fine && !reduce) tilt(fr);
    return f;
  }
  function tilt(n) {
    n.addEventListener("mousemove", function (e) {
      var r = n.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      n.style.transform = "perspective(900px) rotateY(" + x * 8 + "deg) rotateX(" + -y * 8 + "deg)";
    });
    n.addEventListener("mouseleave", function () { n.style.transform = ""; });
  }

  document.title = c.siteTitle || document.title;

  // ---------- тема ----------
  var root = document.documentElement;
  var themeBtn = document.getElementById("themeBtn");
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "Светлая тема" : "Тёмная тема";
    store("theme", t);
  }
  setTheme(store("theme") || c.theme || "dark");
  themeBtn.addEventListener("click", function () { setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"); });

  // ---------- конфетти (фон + салют) ----------
  var cv = document.getElementById("confetti");
  var ctx = cv.getContext("2d");
  var W, H, parts = [], running = false;
  var colors = ["#ff6b4a", "#ffc24b", "#ff3d8b", "#ffffff", "#7a5cff"];
  var ambient = c.confetti !== false && !reduce;
  function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
  resize();
  addEventListener("resize", resize);

  function fall(anywhere) {
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : -20, s: 5 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random() * 1.2, g: 0, r: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.06, col: colors[(Math.random() * colors.length) | 0], a: 0.5, amb: true };
  }
  function burst(x, y) {
    if (reduce) return;
    for (var i = 0; i < 110; i++) {
      var ang = Math.random() * 6.28, sp = 4 + Math.random() * 9;
      parts.push({ x: x, y: y, s: 6 + Math.random() * 7, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 4, g: 0.22,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, col: colors[(Math.random() * colors.length) | 0], a: 1, amb: false });
    }
    start();
  }
  function start() { if (!running) { running = true; requestAnimationFrame(tick); } }
  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += p.g; p.x += p.vx + (p.amb ? Math.sin(p.y / 60) * 0.3 : 0); p.y += p.vy; p.r += p.vr;
      if (!p.amb) { p.vx *= 0.985; p.a -= 0.008; }
      if (p.y > H + 20 || p.a <= 0) { if (p.amb) parts[i] = fall(false); else parts.splice(i, 1); continue; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = p.a; ctx.fillStyle = p.col;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (parts.length) requestAnimationFrame(tick); else { running = false; ctx.clearRect(0, 0, W, H); }
  }
  if (ambient) {
    for (var k = 0, n = Math.min(70, Math.round(W / 18)); k < n; k++) parts.push(fall(true));
    start();
  }

  // ---------- hero ----------
  var hero = el("header", "hero");
  var bg = el("div", "hero-bg");
  if (c.heroImage) { hero.classList.add("has-image"); bg.style.backgroundImage = "url('" + c.heroImage + "')"; }
  hero.appendChild(bg);
  ["b1", "b2", "b3", "b4"].forEach(function (b) { hero.appendChild(el("div", "blob " + b)); });

  var inner = el("div", "hero-in");
  var h1 = el("h1");
  var idx = 0;
  (c.heroTitle || "").replace("{name}", c.friendName || "").split(/\s+/).forEach(function (word) {
    var w = el("span", "w");
    word.split("").forEach(function (ch) {
      var l = el("span", "l", ch);
      l.style.setProperty("--i", idx++);
      w.appendChild(l);
    });
    h1.appendChild(w);
    h1.appendChild(document.createTextNode(" "));
  });
  inner.appendChild(h1);
  if (c.heroSubtitle) inner.appendChild(el("p", "", c.heroSubtitle));
  var cta = el("button", "cta", "Салют!");
  cta.type = "button";
  cta.addEventListener("click", function (e) {
    burst(e.clientX, e.clientY);
    setTimeout(function () { burst(W * 0.25, H * 0.4); burst(W * 0.75, H * 0.4); }, 250);
  });
  inner.appendChild(cta);
  hero.appendChild(inner);
  hero.appendChild(el("div", "scroll-hint", "↓"));
  app.appendChild(hero);

  if (fine && !reduce) {
    hero.addEventListener("mousemove", function (e) {
      hero.style.setProperty("--mx", (e.clientX / innerWidth - 0.5) * 2);
      hero.style.setProperty("--my", (e.clientY / innerHeight - 0.5) * 2);
    });
  }

  // ---------- бегущая строка ----------
  var mq = el("div", "marquee");
  var track = el("div", "track");
  var phrase = (c.siteTitle || "С днём рождения!") + "  ✦  " + (c.friendName || "") + "  ✦";
  for (var m = 0; m < 12; m++) track.appendChild(el("span", "", phrase));
  mq.appendChild(track);
  app.appendChild(mq);

  // ---------- лайтбокс ----------
  var lb = document.getElementById("lightbox");
  var lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption");
  var lbList = [], lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    var it = lbList[lbIndex];
    lbImg.src = it.src; lbImg.alt = it.caption || ""; lbCap.textContent = it.caption || "";
    lb.querySelector(".lb-prev").hidden = lb.querySelector(".lb-next").hidden = lbList.length < 2;
  }
  function lbClose() { lb.hidden = true; lbImg.src = ""; }
  lb.querySelector(".lb-close").addEventListener("click", lbClose);
  lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); lbShow(lbIndex - 1); });
  lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); lbShow(lbIndex + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lbClose(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
    if (e.key === "ArrowRight") lbShow(lbIndex + 1);
  });
  function lbOpen(list, i) { lbList = list; lb.hidden = false; lbShow(i); }

  // ---------- блоки ----------
  var renderers = {
    text: function (s) {
      var b = el("section", "block");
      if (s.title) b.appendChild(el("h2", "", s.title));
      var body = el("div", "body");
      String(s.body || "").split(/\\n\\n|\n\n/).forEach(function (t) {
        if (t.trim()) { var p = el("p"); words(p, t.trim()); body.appendChild(p); }
      });
      b.appendChild(body);
      return b;
    },
    image: function (s) {
      var b = el("section", "block");
      var img = el("img", "zoom par");
      img.src = s.src; img.alt = s.caption || ""; img.loading = "lazy";
      img.addEventListener("click", function () { lbOpen([{ src: s.src, caption: s.caption }], 0); });
      b.appendChild(figure(img, s.caption, true));
      return b;
    },
    gif: function (s) {
      var b = el("section", "block");
      var img = el("img", "par");
      img.src = s.src; img.alt = s.caption || ""; img.loading = "lazy";
      b.appendChild(figure(img, s.caption, true));
      return b;
    },
    video: function (s) {
      var b = el("section", "block");
      var v = el("video");
      v.src = s.src; v.controls = true; v.preload = "metadata"; v.playsInline = true;
      if (s.poster) v.poster = s.poster;
      b.appendChild(figure(v, s.caption, false));
      return b;
    },
    gallery: function (s) {
      var b = el("section", "block wide");
      if (s.title) b.appendChild(el("h2", "", s.title));
      var grid = el("div", "gallery-grid");
      var list = s.images || [];
      list.forEach(function (it, i) {
        var btn = el("button");
        btn.type = "button";
        btn.style.setProperty("--i", i);
        btn.setAttribute("aria-label", it.caption || "Открыть фото");
        var img = el("img");
        img.src = it.src; img.alt = it.caption || ""; img.loading = "lazy";
        btn.appendChild(img);
        btn.addEventListener("click", function () { lbOpen(list, i); });
        grid.appendChild(btn);
      });
      b.appendChild(grid);
      return b;
    }
  };

  var feed = el("div", "feed");
  (c.sections || []).forEach(function (s) {
    var r = renderers[s.type];
    if (!r) { console.warn("Неизвестный тип блока:", s.type); return; }
    var node = r(s);
    node.classList.add("reveal");
    feed.appendChild(node);
  });
  app.appendChild(feed);

  if (c.finalMessage) {
    var f = el("footer", "final reveal");
    if (c.finalMessage.title) f.appendChild(el("h2", "", c.finalMessage.title));
    if (c.finalMessage.text) f.appendChild(el("p", "", c.finalMessage.text));
    if (c.finalMessage.signature) f.appendChild(el("div", "sign", c.finalMessage.signature));
    app.appendChild(f);
  }

  // ---------- появление при скролле ----------
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
          if (en.target.classList.contains("final") && !reduce) burst(W / 2, H * 0.6);
        }
      });
    }, { threshold: 0.18 });
    items.forEach(function (n) { io.observe(n); });
  } else {
    items.forEach(function (n) { n.classList.add("in"); });
  }

  // ---------- скролл: прогресс и параллакс ----------
  var bar = document.getElementById("bar");
  var heroBg = bg;
  var pars = document.querySelectorAll("img.par");
  var ticking = false;
  function onScroll() {
    var y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    if (reduce) return;
    if (y < innerHeight * 1.2) heroBg.style.transform = "translateY(" + y * 0.3 + "px)";
    pars.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var off = (r.top + r.height / 2 - innerHeight / 2) * -0.06;
      img.style.setProperty("--py", off + "px");
    });
  }
  addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { onScroll(); ticking = false; }); }
  }, { passive: true });
  onScroll();

  // ---------- свечение за курсором ----------
  var glow = document.getElementById("glow");
  if (fine && !reduce) {
    addEventListener("mousemove", function (e) {
      glow.style.opacity = 1;
      glow.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
    });
  }

  // ---------- музыка: автозапуск, громкость 40% ----------
  if (c.music) {
    var audio = new Audio(c.music);
    audio.loop = true;
    audio.volume = 0.4;
    var mb = document.getElementById("musicBtn");
    mb.hidden = false;
    var userPaused = false;
    function label() { mb.textContent = audio.paused ? "Включить музыку" : "Выключить музыку"; }
    audio.addEventListener("play", label);
    audio.addEventListener("pause", label);
    label();

    function tryPlay() { var p = audio.play(); if (p && p.catch) p.catch(label); }
    var unlockEvents = ["pointerdown", "keydown", "touchend", "click"];
    function unlock(e) {
      if (mb.contains(e.target) || userPaused) return;
      tryPlay();
    }
    audio.addEventListener("playing", function () {
      unlockEvents.forEach(function (ev) { document.removeEventListener(ev, unlock, true); });
    });
    // Браузеры часто блокируют автозапуск: тогда музыка стартует при первом клике или касании.
    tryPlay();
    unlockEvents.forEach(function (ev) { document.addEventListener(ev, unlock, true); });

    mb.addEventListener("click", function () {
      if (audio.paused) { userPaused = false; tryPlay(); } else { userPaused = true; audio.pause(); }
    });
  }
})();
