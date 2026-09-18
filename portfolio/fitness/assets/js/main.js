/* ============================================================
   FORMA — логика демо
   - переключатель языка RU/EN (data-lang-ru / data-lang-en, localStorage)
   - мобильное меню
   - расписание: единый источник данных, фильтры, таблица + карточки
   - формы: клиентская валидация + сообщение об успехе (без бэкенда)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Язык ---------- */
  var STORE = "forma-lang";
  function currentLang() { return document.documentElement.getAttribute("lang") === "en" ? "en" : "ru"; }

  function setLang(lang) {
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.classList.toggle("on", b.dataset.lang === lang);
    });
    // элементы с двумя наборами текста через атрибуты data-ru / data-en
    document.querySelectorAll("[data-ru]").forEach(function (el) {
      var v = el.getAttribute("data-" + lang);
      if (v !== null) el.textContent = v;
    });
    document.querySelectorAll("[data-ph-ru]").forEach(function (el) {
      var v = el.getAttribute("data-ph-" + lang);
      if (v !== null) el.setAttribute("placeholder", v);
    });
    if (window.__renderSchedule) window.__renderSchedule();
    document.title = document.title; // no-op, оставлено для наглядности
  }

  function initLang() {
    var saved = "ru";
    try { saved = localStorage.getItem(STORE) || "ru"; } catch (e) {}
    setLang(saved === "en" ? "en" : "ru");
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.lang); });
    });
  }

  /* ---------- Мобильное меню ---------- */
  function initNav() {
    var burger = document.querySelector(".burger");
    var links = document.querySelector(".nav-links");
    if (!burger || !links) return;
    burger.addEventListener("click", function () { links.classList.toggle("open"); });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); });
    });
  }

  /* ---------- Данные расписания ----------
     В WordPress-версии это приходит из кастомного типа «Занятие» (class).
     Здесь — статические демо-данные, единый источник для таблицы и карточек. */
  var DAYS = [
    { key: "mon", ru: "Понедельник", en: "Monday" },
    { key: "tue", ru: "Вторник",     en: "Tuesday" },
    { key: "wed", ru: "Среда",       en: "Wednesday" },
    { key: "thu", ru: "Четверг",     en: "Thursday" },
    { key: "fri", ru: "Пятница",     en: "Friday" },
    { key: "sat", ru: "Суббота",     en: "Saturday" },
    { key: "sun", ru: "Воскресенье", en: "Sunday" }
  ];
  var TYPES = {
    strength: { ru: "Сила",     en: "Strength" },
    cardio:   { ru: "Кардио",   en: "Cardio" },
    mind:     { ru: "Тело и ум", en: "Mind & Body" },
    dance:    { ru: "Танцы",    en: "Dance" }
  };
  // t — время, title ru/en, coach, type
  var CLASSES = [
    { day: "mon", t: "08:00", type: "cardio",   ru: "Утренний HIIT",        en: "Morning HIIT",       coach: "Марина Котова" },
    { day: "mon", t: "12:30", type: "strength", ru: "Функциональный трен.", en: "Functional Training", coach: "Артём Лебедев" },
    { day: "mon", t: "19:00", type: "mind",     ru: "Хатха-йога",           en: "Hatha Yoga",         coach: "Ника Орлова" },

    { day: "tue", t: "09:00", type: "strength", ru: "Силовой блок",         en: "Strength Block",     coach: "Артём Лебедев" },
    { day: "tue", t: "18:00", type: "dance",    ru: "Zumba",                en: "Zumba",              coach: "Дарья Сомова" },
    { day: "tue", t: "20:00", type: "cardio",   ru: "Сайклинг",             en: "Cycling",            coach: "Марина Котова" },

    { day: "wed", t: "08:00", type: "mind",     ru: "Пилатес",              en: "Pilates",            coach: "Ника Орлова" },
    { day: "wed", t: "12:30", type: "cardio",   ru: "HIIT-экспресс",        en: "HIIT Express",       coach: "Марина Котова" },
    { day: "wed", t: "19:00", type: "strength", ru: "TRX-петли",            en: "TRX Suspension",     coach: "Артём Лебедев" },

    { day: "thu", t: "09:00", type: "strength", ru: "Функциональный трен.", en: "Functional Training", coach: "Артём Лебедев" },
    { day: "thu", t: "18:00", type: "mind",     ru: "Стретчинг",            en: "Stretching",         coach: "Ника Орлова" },
    { day: "thu", t: "20:00", type: "dance",    ru: "Contemporary",         en: "Contemporary",       coach: "Дарья Сомова" },

    { day: "fri", t: "08:00", type: "cardio",   ru: "Утренний HIIT",        en: "Morning HIIT",       coach: "Марина Котова" },
    { day: "fri", t: "19:00", type: "strength", ru: "Кроссовый круг",       en: "Cross Circuit",      coach: "Артём Лебедев" },

    { day: "sat", t: "10:00", type: "dance",    ru: "Zumba",                en: "Zumba",              coach: "Дарья Сомова" },
    { day: "sat", t: "11:30", type: "mind",     ru: "Йога-флоу",            en: "Yoga Flow",          coach: "Ника Орлова" },
    { day: "sat", t: "13:00", type: "strength", ru: "Силовой блок",         en: "Strength Block",     coach: "Артём Лебедев" },

    { day: "sun", t: "11:00", type: "cardio",   ru: "Сайклинг",             en: "Cycling",            coach: "Марина Котова" },
    { day: "sun", t: "12:30", type: "mind",     ru: "Восстановление",       en: "Recovery Flow",      coach: "Ника Орлова" }
  ];

  var activeFilter = "all";

  function classCell(c, lang) {
    return (
      '<div class="cls" data-type="' + c.type + '">' +
        "<b>" + c[lang] + "</b>" +
        "<small>" + c.coach + "</small><br>" +
        '<span class="type">' + TYPES[c.type][lang] + "</span>" +
      "</div>"
    );
  }

  function renderSchedule() {
    var lang = currentLang();
    var table = document.getElementById("schedTable");
    var cards = document.getElementById("schedCards");
    if (!table) return;

    // все временные слоты (сортированные уникальные)
    var slots = CLASSES.map(function (c) { return c.t; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; })
      .sort();

    var visible = CLASSES.filter(function (c) { return activeFilter === "all" || c.type === activeFilter; });

    /* --- таблица (десктоп) --- */
    var thead = "<tr><th>" + (lang === "ru" ? "Время" : "Time") + "</th>";
    DAYS.forEach(function (d) { thead += "<th>" + d[lang] + "</th>"; });
    thead += "</tr>";

    var rows = "";
    slots.forEach(function (slot) {
      var slotHasAny = visible.some(function (c) { return c.t === slot; });
      if (!slotHasAny) return;
      var row = '<tr><td class="time">' + slot + "</td>";
      DAYS.forEach(function (d) {
        var c = visible.find(function (x) { return x.day === d.key && x.t === slot; });
        row += "<td>" + (c ? classCell(c, lang) : "") + "</td>";
      });
      row += "</tr>";
      rows += row;
    });
    table.innerHTML = "<table class='sched-table'><thead>" + thead + "</thead><tbody>" + rows + "</tbody></table>";

    /* --- карточки (мобайл) --- */
    if (cards) {
      var html = "";
      DAYS.forEach(function (d) {
        var list = visible.filter(function (c) { return c.day === d.key; });
        if (!list.length) return;
        html += '<div class="day-card"><h3>' + d[lang] + "</h3>";
        list.forEach(function (c) {
          html +=
            '<div class="cls" data-type="' + c.type + '">' +
              '<div><b>' + c[lang] + "</b><small style='display:block'>" + c.coach + "</small>" +
              '<span class="type">' + TYPES[c.type][lang] + "</span></div>" +
              '<span class="t">' + c.t + "</span>" +
            "</div>";
        });
        html += "</div>";
      });
      cards.innerHTML = html;
    }
  }
  window.__renderSchedule = renderSchedule;

  function initFilters() {
    var box = document.querySelector(".filters");
    if (!box) return;
    box.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      box.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("on"); });
      chip.classList.add("on");
      activeFilter = chip.dataset.filter || "all";
      renderSchedule();
    });
  }

  /* ---------- Формы (демо, без отправки) ---------- */
  function initForms() {
    document.querySelectorAll("form[data-demo-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var ok = form.querySelector(".form-ok");
        if (ok) { ok.classList.add("show"); ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
        form.reset();
      });
    });
  }

  /* ---------- Год в футере ---------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLang();
    initNav();
    initFilters();
    renderSchedule();
    initForms();
    initYear();
  });
})();
