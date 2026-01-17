// app.js

const LANGS = ["es", "de", "ca", "en"];

// -----------------------------
// Lang helpers
// -----------------------------
function getParamLang() {
  return new URLSearchParams(location.search).get("lang");
}

function setParamLang(lang) {
  const p = new URLSearchParams(location.search);
  p.set("lang", lang);
  history.replaceState({}, "", `${location.pathname}?${p.toString()}`);
}

function getStoredLang() {
  try { return localStorage.getItem("lang"); } catch { return null; }
}

function setStoredLang(lang) {
  try { localStorage.setItem("lang", lang); } catch {}
}

function withLang(href, lang) {
  const url = new URL(href, location.href);
  url.searchParams.set("lang", lang);
  return url.pathname + "?" + url.searchParams.toString();
}

// -----------------------------
// Content loading
// -----------------------------
async function loadContent() {
  const res = await fetch("content.txt", { cache: "no-store" });
  if (!res.ok) throw new Error("content.txt not found");
  return await res.json();
}

function pickLang(data) {
  const param = getParamLang();
  const stored = getStoredLang();
  const def = data?.site?.defaultLang || "es";

  const lang =
    (param && data?.i18n?.[param]) ? param :
    ((stored && data?.i18n?.[stored]) ? stored : def);

  return LANGS.includes(lang) ? lang : def;
}

// -----------------------------
// UI renderers
// -----------------------------
function renderLangSwitch(lang, onChange) {
  const el = document.getElementById("langSwitch");
  if (!el) return;

  el.innerHTML = "";
  LANGS.forEach(code => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lang-btn" + (code === lang ? " active" : "");
    b.textContent = code.toUpperCase();
    b.addEventListener("click", () => onChange(code));
    el.appendChild(b);
  });
}

function renderBrand(data, lang) {
  const nameLink = document.querySelector(".brand-name");
  const loc = document.querySelector(".brand-loc");

  if (nameLink) {
    nameLink.textContent = data?.site?.brand || "Art i Vases";
    nameLink.href = withLang("index.html", lang);
  }
  if (loc) {
    const email = data?.site?.email || "";
    const phone = data?.site?.phone || "";
    loc.textContent = [email, phone].filter(Boolean).join(" · ");
  }
}

/* Crash-safe nav: never wipes links unless new ones are built successfully */
function renderNav(data, lang) {
  const nav = document.querySelector("nav.nav");
  if (!nav) return;

  if (!Array.isArray(data?.nav) || data.nav.length === 0) return;

  const labels = data?.i18n?.[lang]?.navLabels || {};
  const active = document.body.getAttribute("data-active") || "";

  const frag = document.createDocumentFragment();

  data.nav.forEach(item => {
    if (!item || typeof item.href !== "string" || item.href.trim() === "") return;

    const a = document.createElement("a");
    try {
      a.href = withLang(item.href, lang);
    } catch {
      a.href = item.href;
    }

    a.textContent = labels[item.key] || item.key || "";
    if (item.href === active) a.classList.add("active");
    frag.appendChild(a);
  });

  if (frag.childNodes.length > 0) {
    nav.innerHTML = "";
    nav.appendChild(frag);
  }
}

function renderFooter(data, lang) {
  const f = data?.i18n?.[lang]?.footer || {};
  const d = document.getElementById("footerDisclaimer");
  const c = document.getElementById("footerContact");
  if (d) d.textContent = f.disclaimer || "";
  if (c) c.textContent = f.contactLine || "";
}

// -----------------------------
// Pages
// -----------------------------
function renderHome(data, lang) {
  const t = data?.i18n?.[lang]?.home;
  if (!t) return;

  const k = document.getElementById("homeKicker");
  const h = document.getElementById("homeHeadline");
  const p = document.getElementById("homeLead");
  if (k) k.textContent = t.kicker || "";
  if (h) h.textContent = t.headline || "";
  if (p) p.textContent = t.lead || "";

  const cards = document.getElementById("homeCards");
  if (cards && Array.isArray(t.cards)) {
    cards.innerHTML = "";
    t.cards.forEach(card => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h3>${card.title || ""}</h3>
        <p>${card.body || ""}</p>
        <a class="link" href="${withLang(card.href || "kontakt.html", lang)}">→</a>
      `;
      cards.appendChild(div);
    });
  }

  const heroImg = document.getElementById("homeHeroImg");
  if (heroImg) {
    heroImg.src = data?.site?.heroImage || "images/hero.webp";
  }
}

// Unified block renderer for workshop, shop, and future block-based pages
function renderBlockPage(data, lang, pageKey) {
  const t = data?.i18n?.[lang]?.[pageKey];
  if (!t) return;

  const k = document.getElementById("kicker");
  const h = document.getElementById("headline");
  const p = document.getElementById("lead");
  if (k) k.textContent = t.kicker || "";
  if (h) h.textContent = t.headline || "";
  if (p) p.textContent = t.lead || "";

  const wrap = document.getElementById("workWrap") || document.getElementById("shopWrap");
  if (!wrap || !Array.isArray(t.blocks)) return;

  wrap.innerHTML = "";
  t.blocks.forEach((block) => {
    const el = document.createElement("article");
    el.className = "work-block";
    el.innerHTML = `
      <div class="work-media">
        <img src="${block.image || 'images/placeholder.webp'}" alt="${block.title || ''}">
      </div>
      <div class="work-text">
        <h3>${block.title || ""}</h3>
        <p>${block.body || ""}</p>
      </div>
    `;
    wrap.appendChild(el);
  });
}

function renderGenericPage(data, lang, key) {
  const t = data?.i18n?.[lang]?.[key];
  if (!t) return;

  const k = document.getElementById("kicker");
  const h = document.getElementById("headline");
  const p = document.getElementById("lead");
  if (k) k.textContent = t.kicker || "";
  if (h) h.textContent = t.headline || "";
  if (p) p.textContent = t.lead || "";

  const wrap = document.getElementById("blocksWrap");
  if (!wrap || !Array.isArray(t.blocks)) return;

  wrap.innerHTML = "";
  t.blocks.forEach(b => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<h3>${b.title || ""}</h3><p>${b.body || ""}</p>`;
    wrap.appendChild(div);
  });
}

function renderContact(data, lang) {
  const t = data?.i18n?.[lang]?.contact;
  if (!t) return;

  const k = document.getElementById("kicker");
  const h = document.getElementById("headline");
  const p = document.getElementById("lead");
  if (k) k.textContent = t.kicker || "";
  if (h) h.textContent = t.headline || "";
  if (p) p.textContent = t.lead || "";

  const addr = document.getElementById("contactAddress");
  const mail = document.getElementById("contactEmail");
  const phone = document.getElementById("contactPhone");
  const hours = document.getElementById("contactHours");

  if (addr) addr.textContent = t.address || "";
  if (mail) mail.textContent = data?.site?.email || "";
  if (phone) phone.textContent = data?.site?.phone || "";
  if (hours) hours.textContent = data?.site?.hours || "";

  const la = document.getElementById("labelAddress");
  const le = document.getElementById("labelEmail");
  const lp = document.getElementById("labelPhone");
  const lh = document.getElementById("labelHours");
  if (la) la.textContent = t.addressLabel || "";
  if (le) le.textContent = t.emailLabel || "";
  if (lp) lp.textContent = t.phoneLabel || "";
  if (lh) lh.textContent = t.hoursLabel || "";

  const f = t.form || {};
  const fh = document.getElementById("formHeadline");
  if (fh) fh.textContent = f.headline || "";

  const name = document.getElementById("fName");
  const reply = document.getElementById("fReply");
  const subj = document.getElementById("fSubject");
  const msg = document.getElementById("fMessage");
  const send = document.getElementById("fSend");

  if (name) name.placeholder = f.name || "";
  if (reply) reply.placeholder = f.reply || "";
  if (subj) subj.placeholder = f.subject || "";
  if (msg) msg.placeholder = f.message || "";
  if (send) send.textContent = f.send || "Send";
}

// -----------------------------
// Boot
// -----------------------------
async function boot() {
  try {
    const data = await loadContent();
    const lang = pickLang(data);

    setStoredLang(lang);
    setParamLang(lang);

    renderBrand(data, lang);
    renderNav(data, lang);
    renderFooter(data, lang);

    renderLangSwitch(lang, (next) => {
      if (!data?.i18n?.[next]) return;
      setStoredLang(next);
      setParamLang(next);
      location.reload();
    });

    const page = document.body.getAttribute("data-page") || "";

    if (page === "home") renderHome(data, lang);
    if (page === "workshop") renderBlockPage(data, lang, "workshop");
    if (page === "shop") renderBlockPage(data, lang, "shop");
    if (page === "workshops") renderGenericPage(data, lang, "workshops");
    if (page === "events") renderGenericPage(data, lang, "events");
    if (page === "contact") renderContact(data, lang);
    if (page === "legal") renderGenericPage(data, lang, "legal");

  } catch (e) {
    console.error(e);
  }
}

boot();