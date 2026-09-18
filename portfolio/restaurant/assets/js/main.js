/* ============================================================
   Verano demo — shared behaviour.
   Bilingual RU/EN via data-ru / data-en attributes (text +
   selected attributes), mobile nav, gallery lightbox, menu
   filter, booking form (mailto/no-op demo), scroll reveal.
   No frameworks, no build step.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Image fallback ----------
     Unsplash-фото могут не загрузиться (офлайн, блокировка, лимит).
     В этом случае подменяем битую картинку на локальный SVG-плейсхолдер,
     чтобы вёрстка не «сыпалась». */
  var PLACEHOLDER = "assets/img/placeholder.svg";
  function swapToPlaceholder(img) {
    if (!img || img.getAttribute("data-fallback") === "1") return;
    if (img.getAttribute("src") === PLACEHOLDER) return;
    img.setAttribute("data-fallback", "1");
    img.src = PLACEHOLDER;
  }
  // Ловим ошибки загрузки, которые случатся уже после подключения скрипта.
  window.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG") swapToPlaceholder(t);
  }, true);
  // Догоняем картинки, которые успели «упасть» до запуска скрипта.
  Array.prototype.forEach.call(document.images, function (img) {
    img.addEventListener("error", function () { swapToPlaceholder(img); });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
      swapToPlaceholder(img);
    }
  });

  /* ---------- Language ---------- */
  var STORE_KEY = "verano-lang";
  var lang = localStorage.getItem(STORE_KEY) || "ru";

  function applyLang(next) {
    lang = next;
    localStorage.setItem(STORE_KEY, lang);
    document.documentElement.setAttribute("lang", lang);

    // text nodes
    document.querySelectorAll("[data-ru]").forEach(function (el) {
      var val = el.getAttribute("data-" + lang);
      if (val !== null) el.textContent = val;
    });
    // attributes: data-ru-ph / data-en-ph (placeholder), -al (aria-label), -ti (title)
    var attrMap = { ph: "placeholder", al: "aria-label", ti: "title", alt: "alt" };
    Object.keys(attrMap).forEach(function (suffix) {
      document.querySelectorAll("[data-ru-" + suffix + "]").forEach(function (el) {
        var val = el.getAttribute("data-" + lang + "-" + suffix);
        if (val !== null) el.setAttribute(attrMap[suffix], val);
      });
    });
    // elements shown only in one language
    document.querySelectorAll("[data-only]").forEach(function (el) {
      if (el.getAttribute("data-only") === lang) el.removeAttribute("data-lang-hide");
      else el.setAttribute("data-lang-hide", "");
    });
    // toggle buttons
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-set-lang") === lang);
    });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-set-lang]");
    if (btn) { applyLang(btn.getAttribute("data-set-lang")); }
  });

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector(".nav__toggle");
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var nav = document.querySelector(".nav");
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Menu filter ---------- */
  var filterBar = document.querySelector(".menu-filter");
  if (filterBar) {
    filterBar.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      filterBar.querySelectorAll("button").forEach(function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
      var cat = b.getAttribute("data-filter");
      document.querySelectorAll(".menu-cat").forEach(function (sec) {
        var show = cat === "all" || sec.getAttribute("data-cat") === cat;
        sec.style.display = show ? "" : "none";
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lightbox__cap");
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    var current = 0;

    function openAt(i) {
      current = (i + items.length) % items.length;
      var node = items[current];
      var img = node.querySelector("img");
      var full = node.getAttribute("data-full") || img.src;
      lbImg.src = full;
      lbImg.alt = img.alt || "";
      if (lbCap) lbCap.textContent = node.getAttribute("data-cap-" + lang) || img.alt || "";
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() { lb.classList.remove("open"); document.body.style.overflow = ""; }

    items.forEach(function (node, i) {
      node.addEventListener("click", function () { openAt(i); });
    });
    lb.querySelector(".lightbox__close").addEventListener("click", close);
    lb.querySelector(".next").addEventListener("click", function () { openAt(current + 1); });
    lb.querySelector(".prev").addEventListener("click", function () { openAt(current - 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") openAt(current + 1);
      if (e.key === "ArrowLeft") openAt(current - 1);
    });
  }

  /* ---------- Booking form (demo) ---------- */
  var bookingForm = document.getElementById("booking-form");
  if (bookingForm) {
    var dateInput = bookingForm.querySelector('input[type="date"]');
    if (dateInput) {
      var today = new Date();
      dateInput.min = today.toISOString().split("T")[0];
    }
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!bookingForm.reportValidity()) return;
      var ok = document.querySelector(".form-success");
      if (ok) {
        ok.classList.add("show");
        ok.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      bookingForm.reset();
      if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add("in"); });
  }

  /* ---------- Footer year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Init ---------- */
  applyLang(lang);
})();
