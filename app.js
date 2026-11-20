/*
  Schaatsvergelijker – werking (vanaf v83 een apart bestand; tot v82 stond dit in index.html).
  Instellingen, invoercontrole, hulpfuncties, API, schermonderdelen, grafiek en tabellen.
  Vaste gegevens (ANS, banen, topschaatsers) staan in data.js, dat eerder wordt geladen.
*/
'use strict';
/* =====================================================================
   Instellingen
   ===================================================================== */
// Basisadres van de API, de afstanden waarvoor tabbladen worden gemaakt en de 20 lijnkleuren
const API = 'https://speedskatingresults.com/api/';
const DISTANCES = [100, 300, 500, 700, 1000, 1500, 3000, 5000, 10000];
const COLORS = [
  '#1f5fbf',
  '#d1495b',
  '#2a9d8f',
  '#e9a03b',
  '#7b4fbf',
  '#3d8b37',
  '#c4467e',
  '#5a6b7d',
  '#0e7c86',
  '#9c6b30',
  '#e4572e',
  '#4c9be8',
  '#8cb33a',
  '#a23b72',
  '#f2b134',
  '#3b3b98',
  '#17a398',
  '#b55d2f',
  '#6c757d',
  '#d63aaf',
];

/* Er staan bewust GEEN persoonsgegevens in deze pagina, behalve de lijst publiek bekende topschaatsers
(TOP_SKATERS). Andere groepen en geboortedata komen uit een JSON-bestand dat de gebruiker zelf opent
(formaat: zie docs/GROEPEN.md). */
const FILE_FORMAT = 'schaatsvergelijker/1';
// De ANS-tabellen (ANS en ANS_BASE) staan in data.js
/* ANS-percentage voor een race: alleen voor bekende Nederlandse banen ("Heerenveen (NED)"),
   anders null (dan valt de tijd weg als het ANS-vinkje aan staat). */
function ansPct(location, dist) {
  const m = String(location || '').match(/^(.+?)\s*\(NED\)\s*$/);
  if (!m) return null;
  const rink = m[1].trim(),
    base = ANS_BASE[dist];
  if (!base) return null;
  const vals = base.map((b) => ANS[b][rink]);
  if (vals.some((v) => v == null)) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
// Afstanden met een eigen ANS-tabel; voor de andere wordt de correctie afgeleid
const ANS_EXACT = new Set([500, 1000, 1500, 3000, 5000]);
// Alle Nederlandse banen uit de ANS-tabel, alfabetisch (keuzelijst bij een zelf ingevoerde tijd)
const NL_RINKS = [...new Set(Object.values(ANS).flatMap((t) => Object.keys(t)))].sort((a, b) =>
  a.localeCompare(b, 'nl'),
);

// Sleutels in localStorage en hoe lang opgehaalde tijden bewaard blijven (6 uur)
const LS_SEL = 'ssr.selected.v1',
  LS_MINE = 'ssr.mine.v1', // "Mijn schaatsers" (vanaf v67)
  LS_CACHE = 'ssr.cache.v1.',
  CACHE_MS = 6 * 3600 * 1000;

/* =====================================================================
   Invoercontrole
   Alles wat van buiten komt (opgeslagen gegevens in localStorage, de API en
   geïmporteerde JSON-bestanden) gaat door deze functies. Wat niet aan het
   verwachte formaat voldoet, wordt gecorrigeerd of weggelaten.
   ===================================================================== */
const MAX_SKATERS = 100; // maximaal aantal schaatsers in de selectie en in een bestand
const MAX_FILE_BYTES = 1024 * 1024; // maximale grootte van een schaatsersbestand (1 MB)
const MAX_RESPONSE_CHARS = 5 * 1024 * 1024; // maximale grootte van een API-antwoord
const FETCH_TIMEOUT_MS = 15000; // na 15 seconden zonder antwoord wordt een verzoek afgebroken
const MAX_MINE = 500; // maximaal aantal schaatsers in "Mijn schaatsers" (vanaf v67)
const MAX_GROUPS = 30; // maximaal aantal groepen in "Mijn schaatsers"

/* tekst inkorten tot max tekens; geen tekst -> '' */
function cleanStr(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
/* geheel getal binnen [lo, hi], anders null */
function cleanInt(v, lo, hi) {
  return Number.isSafeInteger(v) && v >= lo && v <= hi ? v : null;
}
/* geldig schaatser-ID: positief geheel getal (ook als tekst "12345") */
function cleanId(v) {
  const n = typeof v === 'string' && /^\d{1,9}$/.test(v.trim()) ? +v : v;
  return cleanInt(n, 1, 999999999);
}
/* categoriecode zoals SpeedskatingResults die gebruikt (YA, C1, N4, SA, 40, …) */
function cleanCategory(v) {
  return typeof v === 'string' && /^(Y[A-F]|[ABC][12]|N[1-4]|SA|\d{2})$/i.test(v.trim())
    ? v.trim().toUpperCase()
    : null;
}
/* lijnkleur: alleen een van de eigen 20 kleuren */
function cleanColor(v) {
  return COLORS.includes(v) ? v : null;
}
/* Wedstrijdlink: alleen https-links naar SpeedskatingResults; anders null (dan alleen tekst tonen) */
function safeResultUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value.replace(/^http:/i, 'https:'));
    if (u.protocol !== 'https:') return null;
    if (u.hostname !== 'speedskatingresults.com' && u.hostname !== 'www.speedskatingresults.com') return null;
    return u.href;
  } catch (e) {
    return null;
  }
}
/* Eén opgeslagen schaatser uit localStorage: altijd een nieuw, schoon object */
function cleanSkater(x) {
  if (!x || typeof x !== 'object') return null;
  const id = cleanId(x.id);
  if (id == null) return null;
  return {
    id,
    givenname: cleanStr(x.givenname, 60),
    familyname: cleanStr(x.familyname, 80),
    gender: x.gender === 'f' || x.gender === 'm' ? x.gender : '',
    country: typeof x.country === 'string' && /^[A-Z]{3}$/.test(x.country) ? x.country : '',
    category: cleanCategory(x.category),
    catSeason: cleanInt(x.catSeason, 1900, 2100),
    birth: normBirth(x.birth),
    group: cleanStr(x.group, 200) || null,
    color: cleanColor(x.color),
    hl: x.hl === true,
    draftY: cleanInt(x.draftY, 1925, 2100),
    draftM: cleanInt(x.draftM, 1, 12),
  };
}
/* Groepsnaam in "Mijn schaatsers": tekst van max. 60 tekens zonder stuurtekens; anders '' */
function cleanGroupName(v) {
  return cleanStr(v, 60).replace(/[\u0000-\u001f\u007f]/g, '');
}
/* Opgeslagen "Mijn schaatsers" (vanaf v67): { groups: [naam], skaters: [{…, groups: [naam]}] }.
   Alleen geldige schaatsers, geen dubbele, alleen groepen die in de lijst groups staan. */
function cleanMine(x) {
  const o = x && typeof x === 'object' ? x : {};
  const groups = [];
  if (Array.isArray(o.groups))
    for (const g of o.groups) {
      const n = cleanGroupName(g);
      if (n && !groups.includes(n) && groups.length < MAX_GROUPS) groups.push(n);
    }
  const skaters = [],
    seen = new Set();
  if (Array.isArray(o.skaters))
    for (const x of o.skaters) {
      if (!x || typeof x !== 'object') continue;
      const id = cleanId(x.id);
      if (id == null || seen.has(id)) continue;
      seen.add(id);
      skaters.push({
        id,
        givenname: cleanStr(x.givenname, 60),
        familyname: cleanStr(x.familyname, 80),
        gender: x.gender === 'f' || x.gender === 'm' ? x.gender : '',
        country: typeof x.country === 'string' && /^[A-Z]{3}$/.test(x.country) ? x.country : '',
        category: cleanCategory(x.category),
        catSeason: cleanInt(x.catSeason, 1900, 2100),
        birth: normBirth(x.birth),
        groups: Array.isArray(x.groups)
          ? [...new Set(x.groups.map(cleanGroupName))].filter((g) => groups.includes(g))
          : [],
      });
      if (skaters.length >= MAX_MINE) break;
    }
  return { groups, skaters };
}
/* De opgeslagen selectie: alleen geldige schaatsers, geen dubbele, maximaal MAX_SKATERS,
   en wie geen geldige kleur heeft krijgt de eerste vrije kleur. */
function cleanSelection(list) {
  if (!Array.isArray(list)) return [];
  const out = [],
    seen = new Set();
  for (const x of list) {
    const s = cleanSkater(x);
    if (!s || seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
    if (out.length >= MAX_SKATERS) break;
  }
  const used = new Set(out.map((s) => s.color).filter(Boolean));
  for (const s of out) {
    if (s.color) continue;
    s.color = COLORS.find((c) => !used.has(c)) || COLORS[out.indexOf(s) % COLORS.length];
    used.add(s.color);
  }
  return out;
}
/* De opgeslagen instellingen: alleen bekende sleutels met geldige waarden */
function cleanUi(x) {
  const o = x && typeof x === 'object' ? x : {};
  const bool = (v, d) => (typeof v === 'boolean' ? v : d);
  const maxT = {};
  if (o.maxT && typeof o.maxT === 'object')
    for (const d of DISTANCES) {
      const v = o.maxT[d];
      if (typeof v === 'number' && isFinite(v) && v > 0 && v < 100000) maxT[d] = v;
    }
  return {
    ageFrom: cleanInt(o.ageFrom, 5, 80),
    ageTo: cleanInt(o.ageTo, 5, 80),
    showM: bool(o.showM, true),
    showF: bool(o.showF, true),
    ans: bool(o.ans, false),
    maxT,
    theme: ['auto', 'light', 'dark'].includes(o.theme) ? o.theme : 'auto',
    rink: NL_RINKS.includes(o.rink) || o.rink === '-' ? o.rink : '', // laatst gekozen baan bij + tijd
    // tabje in "Toevoegen"; vanaf v68 zijn Mijn schaatsers en Topschaatsers samen "Uit lijst"
    addTab: ['mine', 'top'].includes(o.addTab)
      ? 'list'
      : ['search', 'list', 'file'].includes(o.addTab)
        ? o.addTab
        : 'search',
    ageSort: cleanInt(o.ageSort, 5, 80), // tabel per leeftijd: gesorteerd op deze leeftijd (null = niet)
  };
}
/* Eén rij uit de API of uit de cache: alleen geldige velden, anders null */
function cleanResult(x) {
  if (!x || typeof x !== 'object') return null;
  const time = cleanStr(x.time, 20);
  const sec = parseTime(time);
  const date = typeof x.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date) ? x.date : null;
  if (sec == null || !(sec > 0) || !date) return null;
  return {
    time,
    sec,
    date,
    location: cleanStr(x.location, 120),
    name: cleanStr(x.name, 200),
    link: safeResultUrl(x.link),
  };
}
/* fetch met time-out en maximale grootte van het antwoord; geeft de tekst terug.
   Vanaf v78 zonder AbortSignal: sommige browserextensies onderscheppen fetch en sturen de opties door
   met postMessage, wat met een AbortSignal een DataCloneError gaf. De time-out stopt nu het wachten;
   een hangend verzoek loopt op de achtergrond vanzelf af. */
async function fetchText(url) {
  let timer;
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(
      () => rej(new Error('geen antwoord binnen ' + FETCH_TIMEOUT_MS / 1000 + ' s')),
      FETCH_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([
      (async () => {
        const r = await fetch(url);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const text = await r.text();
        if (text.length > MAX_RESPONSE_CHARS) throw new Error('antwoord te groot');
        return text;
      })(),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- Zelf ingevoerde tijden (vanaf v51) ----------
   Een zojuist gereden tijd die nog niet op SpeedskatingResults staat. Alleen in deze browser
   bewaard (localStorage), niet in "Opslaan als JSON". Verdwijnt vanzelf zodra dezelfde tijd
   (zelfde afstand en datum, verschil < 0,015 s) via de API binnenkomt. */
const LS_MANUAL = 'ssr.manual.v1';
/* Opgeslagen lijst met zelf ingevoerde tijden: alleen geldige items, maximaal 500 */
function cleanManual(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const x of list.slice(0, 500)) {
    if (!x || typeof x !== 'object') continue;
    const id = cleanId(x.id),
      sec = parseTime(x.time);
    if (id == null || !DISTANCES.includes(x.dist) || sec == null || !(sec > 0)) continue;
    if (typeof x.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.date)) continue;
    out.push({
      mid: typeof x.mid === 'number' && isFinite(x.mid) ? x.mid : Date.now() + out.length,
      id,
      dist: x.dist,
      time: fmtTime(sec),
      date: x.date,
      loc: NL_RINKS.includes(x.loc) ? x.loc : '',
    });
  }
  return out;
}

/* Toestand van de pagina: wie geselecteerd is, welke afstand, en de opgehaalde tijden */
const state = {
  selected: cleanSelection(load(LS_SEL, [])), // gecontroleerd, zie cleanSelection()
  mine: cleanMine(load(LS_MINE, {})), // "Mijn schaatsers", gecontroleerd, zie cleanMine()
  mineView: '*', // gekozen groep in "Mijn schaatsers": '*' alle, 'g:naam' een groep, '-' zonder groep
  distance: 500,
  xMode: 'age', // x-as is altijd leeftijd (datumweergave is verwijderd)
  data: {}, // key `${id}_${dist}` -> array of results | 'loading' | 'error'
  stale: {}, // key -> tijdstip (ms) van oude cache die gebruikt wordt omdat de server niet reageerde
  manual: cleanManual(load(LS_MANUAL, [])), // zelf ingevoerde tijden, zie cleanManual()
};

/* ---------- Opslag in de browser (localStorage) ---------- */
function load(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
}
function save(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}
/* Opgeslagen PR-lijsten van v65–v77 (ssr.cache.v1.pr_<id>) worden niet meer gebruikt: opruimen (v78) */
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith(LS_CACHE + 'pr_')) localStorage.removeItem(k);
  }
} catch (e) {}
function persistSel() {
  save(LS_SEL, state.selected);
  syncMineBirth();
}
function persistMine() {
  save(LS_MINE, state.mine);
}
/* Geboortedatum die bij Geselecteerd is ingevuld ook bij "Mijn schaatsers" bewaren (alleen een
   ingevulde datum; wissen bij Geselecteerd wist hem niet in "Mijn schaatsers") */
function syncMineBirth() {
  let changed = false;
  for (const s of state.selected) {
    const m = s.birth && state.mine.skaters.find((x) => x.id === s.id);
    if (m && m.birth !== s.birth) {
      m.birth = s.birth;
      changed = true;
    }
  }
  if (changed) persistMine();
}
// oudere opslag: seizoen van de categorie vastleggen, zodat de schatting volgend seizoen niet verschuift
state.selected.forEach((s) => {
  if (s.catSeason == null) s.catSeason = currentSeasonStart();
});
/* Tijdencache opruimen (vanaf v85). De sleutels ssr.cache.v1.<id>_<afstand> werden na 6 uur wel opnieuw
   opgehaald, maar nooit verwijderd; bij een volle localStorage (± 5 MB) mislukte save() dan stilletjes.
   Bij het starten verdwijnt de cache van schaatsers die nergens meer voorkomen: niet in de selectie, niet
   in Mijn schaatsers en niet bij de topschaatsers. Alleen sleutels met precies het patroon <id>_<afstand>;
   andere ssr.*-sleutels (zoals zelf ingevoerde tijden in ssr.manual.v1) blijven ongemoeid. */
function pruneCache() {
  const keep = new Set([
    ...state.selected.map((s) => s.id),
    ...state.mine.skaters.map((s) => s.id),
    ...TOP_SKATERS.map((t) => t[0]),
  ]);
  const re = new RegExp('^' + LS_CACHE.replace(/\./g, '\\.') + '(\\d+)_(\\d+)$');
  let n = 0;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const m = (localStorage.key(i) || '').match(re);
      if (m && !keep.has(+m[1])) {
        localStorage.removeItem(m[0]);
        n++;
      }
    }
  } catch (e) {}
  return n; // aantal verwijderde sleutels (voor testen)
}
pruneCache();

/* ---------- Hulpfuncties voor tijden, datums en leeftijden ---------- */
/* "1.23,45" of "38,12" -> aantal seconden (getal); onleesbare tijd -> null */
function parseTime(t) {
  if (t == null) return null;
  const m = String(t)
    .trim()
    .match(/^(?:(\d+)\.)?(\d{1,2}),(\d{1,3})$/);
  if (!m) return null;
  const frac = parseInt(m[3], 10) / Math.pow(10, m[3].length);
  return (m[1] ? parseInt(m[1], 10) * 60 : 0) + parseInt(m[2], 10) + frac;
}
/* aantal seconden -> "1.23,45" of "38,12" */
function fmtTime(s) {
  if (s == null || isNaN(s)) return '';
  let cs = Math.round(s * 100);
  const min = Math.floor(cs / 6000);
  cs -= min * 6000;
  const sec = Math.floor(cs / 100),
    h = cs % 100;
  const hs = String(h).padStart(2, '0');
  return min ? `${min}.${String(sec).padStart(2, '0')},${hs}` : `${sec},${hs}`;
}
/* "2026-11-17" -> Date (in UTC, zodat tijdzones geen rol spelen) */
function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
/* datum -> jaartal met decimalen, bijv. 2026,88 */
function decYear(d) {
  const y = d.getUTCFullYear();
  const s = Date.UTC(y, 0, 1),
    e = Date.UTC(y + 1, 0, 1);
  return y + (d - s) / (e - s);
}
/* leeftijd op datum d in hele jaren en maanden: {y, m} */
function ageParts(birth, d) {
  let y = d.getUTCFullYear() - birth.getUTCFullYear();
  let m = d.getUTCMonth() - birth.getUTCMonth();
  if (d.getUTCDate() < birth.getUTCDate()) m--;
  if (m < 0) {
    y--;
    m += 12;
  }
  return { y, m };
}
/* leeftijd als decimaal getal, bijv. 12,54 jaar (x-as van de grafiek) */
function ageDecimal(birth, d) {
  return (d - birth) / (365.2425 * 86400000);
}
/* leeftijd als tekst, bijv. "12 j 6 m"; met "≈" als die geschat is */
function fmtAge(birth, d, est) {
  const a = ageParts(birth, d);
  return `${est ? '≈ ' : ''}${a.y} j ${a.m} m`;
}
function fmtDateNL(s) {
  const d = parseDate(s);
  return d.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/* ---------- categoriecode (SpeedskatingResults) -> KNSB-naam ---------- */
/* Categorie met geslacht, zoals gebruikelijk: "Heren Pupillen C", "Dames Junioren C1";
   zonder categorie alleen "Heren" of "Dames" (vanaf v54) */
function catLabel(s) {
  const g = s.gender === 'f' ? 'Dames' : s.gender === 'm' ? 'Heren' : '';
  return [g, catName(s.category)].filter(Boolean).join(' ');
}
// De afkortingen van de banen (RINK_SHORT) staan in data.js
function catName(cat) {
  if (cat == null || cat === '') return '';
  const c = String(cat).toUpperCase();
  let m;
  if ((m = c.match(/^Y([A-F])$/))) return 'Pupillen ' + m[1];
  if ((m = c.match(/^([ABC])([12])$/))) return `Junioren ${m[1]}${m[2]}`;
  if ((m = c.match(/^N([1-4])$/))) return 'Neo-senioren ' + m[1];
  if (c === 'SA') return 'Senioren';
  if (/^\d{2}$/.test(c)) {
    const a = +c < 30 ? +c + 100 : +c;
    return 'Masters ' + a;
  }
  return c;
}

/* ---------- Categorie -> geschatte geboortedatum ----------
Jeugd/junioren/neo-senioren: leeftijd op 1 juli van het lopende seizoen.
Senioren (SA) 23-29. Masters: leeftijd op 1 juli van het eindjaar van het seizoen, klassen van 5 jaar. */
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTHS_FULL = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
];
/* Schaatsers waarvan de ingevulde geboortedatum nu wordt gewijzigd (vanaf v49; alleen in het geheugen).
   Een ingevulde datum staat anders als klikbare tekst, zonder keuzelijsten. */
const editBirth = new Set();
const CAT_AGE = {
  YF: 7,
  YE: 8,
  YD: 9,
  YC: 10,
  YB: 11,
  YA: 12,
  C1: 13,
  C2: 14,
  B1: 15,
  B2: 16,
  A1: 17,
  A2: 18,
  N1: 19,
  N2: 20,
  N3: 21,
  N4: 22,
};
/* beginjaar van het lopende seizoen (seizoen loopt van 1 juli t/m 30 juni) */
function currentSeasonStart() {
  const n = new Date();
  return n.getMonth() >= 6 ? n.getFullYear() : n.getFullYear() - 1;
}
/* Schat de geboortedatum uit een categorie (bijv. "C1") en het seizoen waarin die gold.
   Resultaat: 1 januari in het midden van het mogelijke geboortevenster, plus de breedte
   van dat venster in jaren (voor de ±-aanduiding). Zie docs/LEEFTIJD.md. */
function estimateBirth(cat, season) {
  const w = birthWindow(cat, season);
  if (!w) return null;
  // midden van het geboortevenster, afgerond op 1 januari
  const mid = new Date((w.early + w.late) / 2);
  const midYear = Math.round(decYear(mid));
  return { date: new Date(Date.UTC(midYear, 0, 1)), spanYears: w.spanYears };
}
/* Mogelijk geboortevenster bij een categorie: vroegste en laatste geboortedatum (ms, UTC)
   en de breedte in jaren. Gebruikt voor de schatting en voor de jaarkeuze bij "Geboren". */
function birthWindow(cat, season) {
  if (cat == null || cat === '') return null;
  cat = String(cat).toUpperCase();
  const S = season ?? currentSeasonStart(); // seizoen waarin de categorie gold
  let lo, hi; // age range on reference date
  let ref = Date.UTC(S, 6, 1);
  if (CAT_AGE[cat] != null) {
    lo = hi = CAT_AGE[cat];
  } else if (cat === 'SA') {
    lo = 23;
    hi = 29;
  } else if (/^\d{2}$/.test(cat)) {
    lo = parseInt(cat, 10);
    if (lo < 30) lo += 100;
    hi = lo + 4;
    ref = Date.UTC(S + 1, 6, 1);
  } else return null;
  // born between ref-(hi+1)y and ref-lo y  -> midpoint
  const refD = new Date(ref);
  const early = Date.UTC(refD.getUTCFullYear() - hi - 1, 6, 1);
  const late = Date.UTC(refD.getUTCFullYear() - lo, 5, 30);
  return { early, late, spanYears: hi - lo + 1 };
}
/* Past geboortejaar y + maand m (1-12) in het geboortevenster w van de categorie? */
function inBirthWindow(w, y, m) {
  const d = Date.UTC(y, m - 1, 15);
  return d >= w.early && d <= w.late;
}
/* Geboortedatum van een schaatser: ingevuld (est:false) of geschat uit de categorie (est:true) */
function birthOf(sk) {
  if (sk.birth) {
    return { date: parseDate(sk.birth), est: false };
  }
  const e = estimateBirth(sk.category, sk.catSeason);
  return e ? { date: e.date, est: true, span: e.spanYears } : null;
}

/* ---------- Communicatie met de SpeedskatingResults-API ---------- */
let active = 0;
const queue = [];
/* Wachtrij: maximaal 4 verzoeken tegelijk naar de API, om de server niet te overbelasten */
function limited(fn) {
  return new Promise((res, rej) => {
    queue.push({ fn, res, rej });
    pump();
  });
}
function pump() {
  while (active < 4 && queue.length) {
    const { fn, res, rej } = queue.shift();
    active++;
    fn()
      .then(res, rej)
      .finally(() => {
        active--;
        pump();
      });
  }
}
/* Zoek schaatsers op naam. De XML-variant van de API geeft tot 20 resultaten (JSON maar 10). */
async function searchSkaters(params) {
  // XML-variant geeft max. 20 resultaten (JSON max. 10)
  const q = new URLSearchParams(params).toString();
  const xml = new DOMParser().parseFromString(
    await fetchText(API + 'xml/skater_lookup.php?' + q),
    'application/xml',
  );
  return [...xml.querySelectorAll('skater')]
    .slice(0, 50)
    .map((s) => {
      const g = (n) => {
        const el = s.querySelector(n);
        return el ? el.textContent.trim() : '';
      };
      return {
        id: cleanId(g('id')),
        familyname: cleanStr(g('familyname'), 80),
        givenname: cleanStr(g('givenname'), 60),
        country: /^[A-Z]{3}$/.test(g('country')) ? g('country') : '',
        gender: g('gender') === 'f' || g('gender') === 'm' ? g('gender') : '',
        category: cleanCategory(g('category')),
      };
    })
    .filter((s) => s.id != null);
}
/* Alle tijden van één schaatser op één afstand, gesorteerd op datum.
   Uitkomst wordt 6 uur bewaard in localStorage, zodat wisselen van afstand snel gaat. */
async function getResults(id, dist) {
  const key = `${id}_${dist}`;
  // cache gebruiken als die jong genoeg is én het verwachte formaat heeft; anders opnieuw ophalen
  const cached = load(LS_CACHE + key, null);
  if (cached && typeof cached.t === 'number' && Date.now() - cached.t < CACHE_MS && Array.isArray(cached.r)) {
    const rows = cached.r.map(cleanResult);
    if (rows.every(Boolean)) return rows;
  }
  let rows;
  try {
    const text = await limited(() =>
      fetchText(`${API}json/skater_results.php?skater=${cleanId(id)}&distance=${+dist}`),
    );
    const j = JSON.parse(text);
    rows = (Array.isArray(j && j.results) ? j.results : [])
      .map(cleanResult)
      .filter(Boolean)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.sec - b.sec));
  } catch (err) {
    // Server traag of onbereikbaar: dan liever oude tijden uit de cache (ouder dan 6 uur) dan niets
    if (cached && typeof cached.t === 'number' && Array.isArray(cached.r)) {
      const old = cached.r.map(cleanResult);
      if (old.every(Boolean)) {
        state.stale[key] = cached.t;
        console.warn('Oude cache gebruikt voor', key, err);
        return old;
      }
    }
    throw err;
  }
  delete state.stale[key];
  save(LS_CACHE + key, { t: Date.now(), r: rows });
  return rows;
}
/* Loop chronologisch door de races en houd elk nieuw PR bij (met het vorige PR erbij) */
function prProgression(rows) {
  const out = [];
  let best = Infinity;
  for (const r of rows) {
    if (r.sec < best) {
      out.push({ ...r, prev: best === Infinity ? null : best });
      best = r.sec;
    }
  }
  return out;
}

/* ---------- Blok "Schaatser zoeken" ---------- */
const $ = (id) => document.getElementById(id);
$('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const p = {};
  const fam = $('fFam').value.trim(),
    giv = $('fGiv').value.trim();
  if (fam) p.familyname = fam;
  if (giv) p.givenname = giv;
  if (!fam && !giv) {
    $('searchStatus').textContent = 'Vul (een deel van) een naam in.';
    return;
  }
  $('searchStatus').textContent = 'Zoeken…';
  $('results').innerHTML = '';
  try {
    const list = await searchSkaters(p);
    $('searchStatus').textContent = list.length
      ? `${list.length} gevonden${list.length >= 20 ? ' (max. 20 – verfijn je zoekopdracht)' : ''}`
      : 'Niets gevonden.';
    renderResults(list);
  } catch (err) {
    $('searchStatus').textContent = 'Zoeken mislukt: ' + err.message;
  }
});
let lastResults = [];
/* Toon de zoekresultaten met een knop "+ Toevoegen" (of "Toegevoegd") */
/* Keuzelijsten "maand" en "jaar" voor de geboortedatum (gedeeld door Geselecteerd en de zoekresultaten).
   Jaarkeuze: alleen de jaren die bij de categorie passen. Zonder (herkende) categorie alle jaren.
   Een al ingevuld jaar buiten het venster blijft zichtbaar. */
function birthSelects(s, selY, selM) {
  const w = birthWindow(s.category, s.catSeason);
  const thisY = new Date().getFullYear();
  const years = [];
  const yFrom = w ? new Date(w.late).getUTCFullYear() : thisY - 3;
  const yTo = w ? new Date(w.early).getUTCFullYear() : 1925;
  for (let y = yFrom; y >= yTo; y--) years.push(y);
  if (selY && !years.includes(selY)) {
    years.push(selY);
    years.sort((a, b) => b - a);
  }
  const yOpt = (y) => `<option value="${y}" ${y === selY ? 'selected' : ''}>${y}</option>`;
  const yearSel =
    `<select data-act="by" title="Geboortejaar${w ? ' (passend bij de categorie)' : ''}"><option value="">jaar</option>` +
    years.map(yOpt).join('') +
    '</select>';
  const monthSel =
    `<select data-act="bm" title="Geboortemaand"><option value="">maand</option>` +
    MONTHS.map((n, i) => `<option value="${i + 1}" ${i + 1 === selM ? 'selected' : ''}>${n}</option>`).join(
      '',
    ) +
    '</select>';
  return { monthSel, yearSel };
}
/* Maand en jaar moeten samen in het geboortevenster van de categorie passen.
   De laatste keuze (act: 'bm' of 'by') wint; alles blijft kiesbaar, zodat je een vergissing altijd
   kunt herstellen. Geeft het (eventueel aangepaste) paar { y, m } terug. */
function resolveBirthPick(s, act, y, m) {
  const w = birthWindow(s.category, s.catSeason);
  if (w && y && m && !inBirthWindow(w, y, m)) {
    const y0 = new Date(w.early).getUTCFullYear();
    const y1 = new Date(w.late).getUTCFullYear();
    if (act === 'bm') {
      // nieuwe maand: past die in maar één jaar (categorie van één jaar), dan dat jaar;
      // anders het jaar leegmaken zodat je opnieuw kiest
      const fits = [];
      for (let yy = y0; yy <= y1; yy++) if (inBirthWindow(w, yy, m)) fits.push(yy);
      y = fits.length === 1 ? fits[0] : null;
    } else if (y >= y0 && y <= y1) {
      m = null; // nieuw jaar binnen de categorie, maar de maand past daar niet bij: maand opnieuw kiezen
    }
  } else if (w && m && !y) {
    // alleen een maand gekozen: past die in maar één jaar van de categorie, dan dat jaar invullen
    const fits = [];
    for (let yy = new Date(w.early).getUTCFullYear(); yy <= new Date(w.late).getUTCFullYear(); yy++)
      if (inBirthWindow(w, yy, m)) fits.push(yy);
    if (fits.length === 1) y = fits[0];
  }
  return { y, m };
}
/* Geboortedatum die bij een zoekresultaat al vóór het toevoegen is gekozen: id -> { y, m } (alleen in het geheugen) */
const resBirth = {};
function renderResults(list) {
  lastResults = list;
  const ids = new Set(state.selected.map((s) => s.id));
  $('results').innerHTML = list
    .map((s, i) => {
      const added = ids.has(s.id);
      const pick = resBirth[s.id] || {};
      const { monthSel, yearSel } = birthSelects(
        { category: s.category, catSeason: currentSeasonStart() },
        pick.y || '',
        pick.m || '',
      );
      const done = pick.y && pick.m;
      return `
    <div class="res ${added ? 'added' : ''}" data-i="${i}">
      <div><div>${esc(s.givenname)} ${esc(s.familyname)}</div>
      <div class="meta">${esc(s.country)} · ${esc(catLabel(s))} · <a href="https://speedskatingresults.com/index.php?p=17&s=${Number(s.id)}" target="_blank" rel="noopener">profiel ↗</a></div></div>
      <button class="small ${added ? 'ghost' : ''}" data-i="${i}" ${added ? 'disabled' : ''}>${added ? 'Toegevoegd' : '+ Toevoegen'}</button>
      ${
        added
          ? ''
          : `<div class="birth">Geboren ${monthSel}${yearSel}${done ? '<span class="birthok">✓</span>' : ''}</div>
`
      }
    </div>`;
    })
    .join('');
  // één melding boven de lijst (niet bij elke schaatser): alleen als er iemand zonder geboortedatum staat
  const open = list.some((s) => !ids.has(s.id) && !(resBirth[s.id] && resBirth[s.id].y && resBirth[s.id].m));
  if (open)
    $('results').insertAdjacentHTML(
      'afterbegin',
      '<div class="birthhint"><b>Vul de geboortemaand in</b> voordat je toevoegt (staat op het profiel ↗). Zonder geboortemaand wordt de leeftijd geschat: ±6 maanden bij jeugd, meerdere jaren bij senioren en masters. Achteraf invullen kan ook.</div>',
    );
}
// geboortemaand/-jaar kiezen bij een zoekresultaat (zelfde regels als bij Geselecteerd)
$('results').addEventListener('change', (e) => {
  const act = e.target.dataset.act;
  if (act !== 'by' && act !== 'bm') return;
  const row = e.target.closest('.res');
  const s = lastResults[+row.dataset.i];
  let y = +row.querySelector('[data-act=by]').value || null;
  let m = +row.querySelector('[data-act=bm]').value || null;
  ({ y, m } = resolveBirthPick({ category: s.category, catSeason: currentSeasonStart() }, act, y, m));
  resBirth[s.id] = { y, m };
  renderResults(lastResults);
  const again = $('results').querySelector(
    `.res[data-i="${row.dataset.i}"] [data-act=${y && !m ? 'bm' : !y && m ? 'by' : act}]`,
  );
  if (again) again.focus();
});
$('results').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]');
  if (!b) return;
  const s = lastResults[+b.dataset.i];
  const pick = resBirth[s.id] || {};
  const extra =
    pick.y && pick.m
      ? { birth: `${pick.y}-${String(pick.m).padStart(2, '0')}-15` }
      : { draftY: pick.y || null, draftM: pick.m || null };
  if (addSkater({ ...s, catSeason: currentSeasonStart(), ...extra })) {
    persistSel();
    renderResults(lastResults);
    renderSelected();
    refresh();
  }
});
/* Voeg één schaatser toe aan de selectie met de eerste nog vrije kleur; false als hij er al in zat */
function addSkater(s) {
  if (state.selected.some((x) => x.id === s.id)) return false;
  if (state.selected.length >= MAX_SKATERS) return false; // selectie is vol
  const used = new Set(state.selected.map((x) => x.color));
  s.color = COLORS.find((c) => !used.has(c)) || COLORS[state.selected.length % COLORS.length];
  s.birth = s.birth || null;
  state.selected.push(s);
  return true;
}

/* ---------- schaatsersbestand (JSON) laden en opslaan ---------- */
let fileSkaters = []; // alleen in het geheugen; wordt niet in de browser opgeslagen
/* "2014-02" of "2014-02-15" -> "2014-02-15"; anders null */
function normBirth(b) {
  const m = String(b || '').match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (!m || +m[2] < 1 || +m[2] > 12) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${(m[3] || '15').padStart(2, '0')}`;
}
/* Lees de tekst van een schaatsersbestand (JSON) en zet elke schaatser om naar een vast formaat */
/* opt.max: maximaal aantal schaatsers (standaard MAX_SKATERS); opt.keepGroups: groepen uit het bestand
   overnemen (velden groups of group, voor "Mijn schaatsers"); anders is groups altijd leeg */
function parseSkaterFile(text, opt = {}) {
  const max = opt.max || MAX_SKATERS;
  if (text.length > MAX_FILE_BYTES) throw new Error('bestand is groter dan 1 MB');
  const j = JSON.parse(text);
  const list = Array.isArray(j) ? j : j && j.skaters;
  if (!Array.isArray(list)) throw new Error('geen lijst "skaters" gevonden');
  if (list.length > max) throw new Error(`meer dan ${max} schaatsers in het bestand`);
  const seen = new Set();
  return list
    .map((x) => {
      if (!x || typeof x !== 'object') return null;
      const id = cleanId(x.id);
      if (id == null || seen.has(id)) return null; // ongeldig of dubbel ID: overslaan
      seen.add(id);
      let giv = cleanStr(x.givenname, 60),
        fam = cleanStr(x.familyname, 80);
      const name = cleanStr(x.name, 140);
      if (!giv && !fam && name) {
        const i = name.indexOf(' ');
        giv = i > 0 ? name.slice(0, i) : name;
        fam = i > 0 ? name.slice(i + 1) : '';
      }
      // groepen uit het bestand tellen alleen bij het importeren in Mijn schaatsers (opt.keepGroups)
      return {
        id,
        givenname: giv,
        familyname: fam,
        gender: x.gender === 'f' || x.gender === 'm' ? x.gender : '',
        country: typeof x.country === 'string' && /^[A-Z]{3}$/.test(x.country) ? x.country : '',
        category: cleanCategory(x.category),
        catSeason: cleanInt(x.catSeason, 1900, 2100),
        birth: normBirth(x.birth),
        groups: opt.keepGroups ? fileGroups(x) : [],
      };
    })
    .filter(Boolean);
}
/* Groepen van één schaatser in een geïmporteerd bestand: lijst groups, of (oud) tekst group met komma's */
function fileGroups(x) {
  const raw = Array.isArray(x.groups) ? x.groups : typeof x.group === 'string' ? x.group.split(',') : [];
  return [...new Set(raw.map(cleanGroupName).filter(Boolean))].slice(0, 10);
}
/* Open een gekozen of gesleept bestand. Vanaf v70 zonder groepen: de schaatsers uit het bestand staan
   klaar voor de knop Toevoegen (alleen in het geheugen). Groepen horen alleen bij Mijn schaatsers. */
function loadSkaterFile(file) {
  if (file.size > MAX_FILE_BYTES) {
    $('fileName').textContent = 'Kon bestand niet lezen: bestand is groter dan 1 MB';
    return;
  }
  const rd = new FileReader();
  rd.onload = () => {
    try {
      fileSkaters = parseSkaterFile(rd.result);
      $('fileName').textContent = `${file.name}: ${fileSkaters.length} schaatsers`;
      $('fileAdd').disabled = !fileSkaters.length;
      $('fileInfo').textContent = fileSkaters.length
        ? fileSkaters.map((s) => `${s.givenname} ${s.familyname}`.trim()).join(', ') + '.'
        : 'Geen geldige schaatsers in dit bestand.';
    } catch (err) {
      fileSkaters = [];
      $('fileAdd').disabled = true;
      $('fileInfo').textContent = '';
      $('fileName').textContent = 'Kon bestand niet lezen: ' + err.message;
    }
  };
  rd.readAsText(file);
}
$('fileOpen').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', (e) => {
  if (e.target.files[0]) loadSkaterFile(e.target.files[0]);
  e.target.value = '';
});
['dragover', 'dragenter'].forEach((t) =>
  $('fileCard').addEventListener(t, (e) => {
    e.preventDefault();
    $('fileCard').style.outline = '2px dashed var(--accent)';
  }),
);
['dragleave', 'drop'].forEach((t) =>
  $('fileCard').addEventListener(t, (e) => {
    e.preventDefault();
    $('fileCard').style.outline = '';
  }),
);
$('fileCard').addEventListener('drop', (e) => {
  const f = e.dataTransfer.files[0];
  if (f) loadSkaterFile(f);
});
/* lijst {id,givenname,familyname,gender,country,category,catSeason,birth,groups} toevoegen; bestaande bijwerken */
function addSkaterList(list, infoEl) {
  if (!list.length) return;
  let added = 0,
    updated = 0;
  for (const f of list) {
    const cur = state.selected.find((x) => x.id === f.id);
    const grp = f.groups.join(', ') || null;
    if (cur) {
      // bestaat al: geboortedatum en groep overnemen
      if (f.birth && f.birth !== cur.birth) {
        cur.birth = f.birth;
        cur.draftY = cur.draftM = null;
        updated++;
      }
      if (grp) cur.group = grp;
    } else if (
      addSkater({
        id: f.id,
        givenname: f.givenname,
        familyname: f.familyname,
        gender: f.gender,
        country: f.country,
        category: f.category,
        catSeason: f.catSeason ?? (f.category ? currentSeasonStart() : null),
        birth: f.birth,
        group: grp,
      })
    )
      added++;
  }
  persistSel();
  renderResults(lastResults);
  renderSelected();
  refresh();
  infoEl.textContent =
    `${added} toegevoegd` +
    (updated ? `, bij ${updated} de geboortedatum bijgewerkt` : '') +
    (list.length - added - updated > 0 ? `, ${list.length - added - updated} stond(en) er al` : '') +
    (state.selected.length >= MAX_SKATERS ? ` De selectie is vol (max. ${MAX_SKATERS}).` : '.');
}
$('fileAdd').addEventListener('click', () => addSkaterList(fileSkaters, $('fileInfo')));

/* ---------- Blok "Mijn schaatsers" (vanaf v67) ----------
   Een coach bewaart zijn eigen schaatsers, verdeeld over groepen, in de localStorage van de eigen
   browser (niet op een server en niet in de pagina zelf). Met Exporteren/Importeren gaan ze als
   JSON-bestand naar een andere browser of computer. Een schaatser kan in meer groepen staan, of in
   geen enkele. Formaat van het bestand: zie docs/GROEPEN.md. */
const MINE_FORMAT = 'schaatsvergelijker-mijn/1';
const byName = (a, b) =>
  a.familyname.localeCompare(b.familyname, 'nl') || a.givenname.localeCompare(b.givenname, 'nl');
function mineById(id) {
  return state.mine.skaters.find((x) => x.id === id);
}
/* Naam van de gekozen groep, of null bij "Alle" of "Zonder groep" */
function mineGroup() {
  return state.mineView.startsWith('g:') ? state.mineView.slice(2) : null;
}
/* De schaatsers die bij de gekozen groep horen, gesorteerd op achternaam */
function mineChosen() {
  const v = state.mineView,
    g = mineGroup();
  return state.mine.skaters
    .filter((s) => (v === '*' ? true : v === '-' ? !s.groups.length : s.groups.includes(g)))
    .sort(byName);
}
/* Kopie om een actie ongedaan te kunnen maken */
function mineBackup() {
  return JSON.parse(JSON.stringify(state.mine));
}
function setMine(m) {
  state.mine = cleanMine(m);
  persistMine();
  renderSelected(); // tekent ook Mijn schaatsers opnieuw
  checkNewPRs(); // nieuwe schaatsers: PR's vastleggen (vanaf v86)
}
function mineInfo(text) {
  $('mineInfo').textContent = text;
}
/* Knop op het kaartje bij Geselecteerd */
function mineCardBtn(s) {
  return mineById(s.id)
    ? `<button type="button" class="ownadd" data-act="mine" title="Staat in Mijn schaatsers; klik om dat blok te openen">✓ Mijn schaatsers</button>`
    : `<button type="button" class="ownadd" data-act="mine" title="Bewaren in Mijn schaatsers${mineGroup() ? ` (groep ${esc(mineGroup())})` : ''}">+ Mijn schaatsers</button>`;
}
/* Schaatsers (uit de selectie) bewaren in Mijn schaatsers, eventueel in groep g.
   Bestaat iemand al, dan worden naam, categorie en een ingevulde geboortedatum bijgewerkt. */
function keepInMine(list, g) {
  let added = 0,
    updated = 0,
    full = 0;
  for (const s of list) {
    const cur = mineById(s.id);
    if (cur) {
      Object.assign(cur, {
        givenname: s.givenname || cur.givenname,
        familyname: s.familyname || cur.familyname,
        gender: s.gender || cur.gender,
        country: s.country || cur.country,
        category: s.category || cur.category,
        catSeason: s.category ? s.catSeason : cur.catSeason,
        birth: s.birth || cur.birth,
      });
      if (g && !cur.groups.includes(g)) cur.groups.push(g);
      updated++;
    } else if (state.mine.skaters.length < MAX_MINE) {
      state.mine.skaters.push({
        id: s.id,
        givenname: s.givenname,
        familyname: s.familyname,
        gender: s.gender || '',
        country: s.country || '',
        category: s.category || null,
        catSeason: s.catSeason ?? null,
        birth: s.birth || null,
        groups: g ? [g] : [],
      });
      added++;
    } else full++;
  }
  persistMine();
  return { added, updated, full };
}
/* Keuzelijst met groepen en de lijst met schaatsers opnieuw opbouwen */
function renderMine() {
  fillListSel(); // keuzelijst "Uit lijst" toont Mijn schaatsers bovenaan
  renderNewPRs(); // nieuwe PR's (vanaf v86): een verwijderde schaatser valt eruit
  const m = state.mine,
    sel = $('mineSel');
  const count = (g) => m.skaters.filter((s) => s.groups.includes(g)).length;
  const none = m.skaters.filter((s) => !s.groups.length).length;
  const opt = (v, t) => `<option value="${esc(v)}">${esc(t)}</option>`;
  sel.innerHTML =
    opt('*', `Alle mijn schaatsers (${m.skaters.length})`) +
    (m.groups.length
      ? '<optgroup label="Groepen">' +
        m.groups.map((g) => opt('g:' + g, `${g} (${count(g)})`)).join('') +
        '</optgroup>'
      : '') +
    (none && m.groups.length ? opt('-', `Zonder groep (${none})`) : '');
  sel.value = state.mineView;
  if (sel.value !== state.mineView) sel.value = state.mineView = '*'; // groep bestaat niet meer
  const g = mineGroup(),
    list = mineChosen();
  $('mineRen').disabled = $('mineDel').disabled = !g;
  $('mineExp').disabled = !list.length;
  if (!m.skaters.length) {
    $('mineList').innerHTML =
      '<div class="empty" style="padding:10px">Nog geen eigen schaatsers. Zoek een schaatser, voeg hem toe en klik op het kaartje op "+ Mijn schaatsers".</div>';
    return;
  }
  if (!list.length) {
    $('mineList').innerHTML =
      `<div class="empty" style="padding:10px">Nog niemand in deze groep. Kies de groep en klik bij Geselecteerd op een kaartje op "+ Mijn schaatsers", of zet bij een schaatser onder "groepen" deze groep aan.</div>`;
    return;
  }
  $('mineList').innerHTML = list
    .map((s) => {
      const born = s.birth
        ? `geb. ${MONTHS[+s.birth.slice(5, 7) - 1]} ${s.birth.slice(0, 4)}`
        : 'geboortedatum onbekend';
      const chips = s.groups.map((x) => `<span class="chip" title="Groep">${esc(x)}</span>`).join('');
      const edit = mineEdit.has(s.id);
      return `
    <div class="res mine" data-id="${Number(s.id)}">
      <div><div>${esc(s.givenname)} ${esc(s.familyname)} <a class="prof" href="https://speedskatingresults.com/index.php?p=17&s=${Number(s.id)}" target="_blank" rel="noopener" title="Profiel op SpeedskatingResults" aria-label="Profiel op SpeedskatingResults">↗</a></div>
      <div class="meta">${esc([catLabel(s), born].filter(Boolean).join(' · '))}${chips}</div></div>
      <span class="mbtns">
        ${m.groups.length ? `<button class="small ghost" data-act="mgrp" aria-expanded="${edit}" title="Groepen van deze schaatser kiezen">groepen</button>` : ''}
        <button class="x" data-act="mrm" title="${g ? `Uit de groep ${esc(g)} halen` : 'Verwijderen uit Mijn schaatsers'}">×</button>
      </span>
      ${
        edit && m.groups.length
          ? `<div class="mgroups">${m.groups.map((x, i) => `<button type="button" class="${s.groups.includes(x) ? 'on' : ''}" data-act="mtog" data-gi="${i}" aria-pressed="${s.groups.includes(x)}">${esc(x)}</button>`).join('')}</div>`
          : ''
      }
    </div>`;
    })
    .join('');
}
const mineEdit = new Set(); // ID's waarbij de groepsknoppen open staan (alleen in het geheugen)
$('mineSel').addEventListener('change', () => {
  state.mineView = $('mineSel').value;
  mineEdit.clear();
  renderSelected(); // ook de knop "+ Mijn schaatsers" noemt de gekozen groep
});
$('mineList').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const s = mineById(+b.closest('.mine').dataset.id);
  if (!s) return;
  const act = b.dataset.act,
    g = mineGroup();
  if (act === 'mgrp') {
    if (mineEdit.has(s.id)) mineEdit.delete(s.id);
    else mineEdit.add(s.id);
    renderMine();
  } else if (act === 'mtog') {
    const x = state.mine.groups[+b.dataset.gi];
    s.groups = s.groups.includes(x) ? s.groups.filter((y) => y !== x) : [...s.groups, x];
    persistMine();
    renderMine();
  } else if (act === 'mrm') {
    const backup = mineBackup();
    const name = `${s.givenname} ${s.familyname}`.trim();
    if (g) s.groups = s.groups.filter((y) => y !== g);
    else state.mine.skaters = state.mine.skaters.filter((y) => y.id !== s.id);
    persistMine();
    renderSelected();
    showToast(
      g ? `${name} uit ${g} gehaald` : `${name} verwijderd uit Mijn schaatsers`,
      'Ongedaan maken',
      () => setMine(backup),
    );
  }
});
/* Groep aanmaken of hernoemen: één invoerregel onder de knoppen */
let mineFormMode = null; // 'new' of 'rename'
function openMineForm(mode) {
  mineFormMode = mode;
  $('mineForm').hidden = false;
  $('mineName').value = mode === 'rename' ? mineGroup() : '';
  $('mineOk').textContent = mode === 'rename' ? 'Hernoemen' : 'Aanmaken';
  $('mineName').focus();
  $('mineName').select();
}
function closeMineForm() {
  mineFormMode = null;
  $('mineForm').hidden = true;
}
function submitMineForm() {
  const name = cleanGroupName($('mineName').value),
    old = mineGroup(),
    m = state.mine;
  if (!name) return mineInfo('Vul een naam voor de groep in.');
  if (mineFormMode === 'rename') {
    if (name === old) return closeMineForm();
    if (m.groups.includes(name)) return mineInfo(`Er is al een groep ${name}.`);
    m.groups = m.groups.map((x) => (x === old ? name : x));
    m.skaters.forEach((s) => (s.groups = s.groups.map((x) => (x === old ? name : x))));
    // ook de groepsnaam op de kaartjes bij Geselecteerd
    state.selected.forEach((s) => {
      if (s.group)
        s.group = s.group
          .split(/,\s*/)
          .map((x) => (x === old ? name : x))
          .join(', ');
    });
    save(LS_SEL, state.selected);
    mineInfo(`Groep ${old} heet nu ${name}.`);
  } else {
    if (m.groups.includes(name)) return mineInfo(`Er is al een groep ${name}.`);
    if (m.groups.length >= MAX_GROUPS) return mineInfo(`Maximaal ${MAX_GROUPS} groepen.`);
    m.groups.push(name);
    mineInfo(
      `Groep ${name} aangemaakt. Voeg schaatsers toe met "+ Mijn schaatsers" op een kaartje, of zet de groep aan bij een schaatser.`,
    );
  }
  state.mineView = 'g:' + name;
  persistMine();
  closeMineForm();
  renderSelected();
}
$('mineNew').addEventListener('click', () => openMineForm('new'));
$('mineRen').addEventListener('click', () => mineGroup() && openMineForm('rename'));
$('mineOk').addEventListener('click', submitMineForm);
$('mineCancel').addEventListener('click', closeMineForm);
$('mineName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitMineForm();
  } else if (e.key === 'Escape') closeMineForm();
});
// groep verwijderen: de schaatsers blijven bewaard (eventueel zonder groep)
$('mineDel').addEventListener('click', () => {
  const g = mineGroup();
  if (!g) return;
  const backup = mineBackup();
  state.mine.groups = state.mine.groups.filter((x) => x !== g);
  state.mine.skaters.forEach((s) => (s.groups = s.groups.filter((x) => x !== g)));
  state.mineView = '*';
  persistMine();
  closeMineForm();
  renderSelected();
  showToast(`Groep ${g} verwijderd (de schaatsers blijven bewaard)`, 'Ongedaan maken', () => {
    state.mineView = 'g:' + g;
    setMine(backup);
  });
});
/* Exporteren: alles of alleen de gekozen groep als JSON-bestand. Het bestand kan ook in het tabje
   Bestand worden geopend (lijst skaters, zelfde velden als "Opslaan als JSON"; groepen tellen daar niet). */
$('mineExp').addEventListener('click', () => {
  const list = mineChosen(),
    g = mineGroup();
  if (!list.length) return mineInfo('Geen schaatsers om te exporteren.');
  const created = new Date().toISOString().slice(0, 10);
  const doc = {
    format: MINE_FORMAT,
    description: g
      ? `Groep ${g} uit Mijn schaatsers (Schaatsvergelijker)`
      : 'Mijn schaatsers (Schaatsvergelijker)',
    created,
    groups: g ? [g] : state.mineView === '-' ? [] : state.mine.groups,
    skaters: list.map((s) => ({
      id: s.id,
      name: `${s.givenname} ${s.familyname}`.trim(),
      givenname: s.givenname,
      familyname: s.familyname,
      gender: s.gender || null,
      country: s.country || null,
      birth: s.birth ? s.birth.slice(0, 7) : null,
      category: s.category ?? null,
      catSeason: s.catSeason ?? null,
      groups: g ? [g] : s.groups,
    })),
  };
  // bestandsnaam: de groepsnaam
  const fileName = g ? g.replace(/[\\/:*?"<>|]/g, '-') : `mijn-schaatsers-${created}`;
  downloadJson(doc, fileName + '.json');
  mineInfo(`${list.length} schaatsers geëxporteerd naar ${fileName}.json.`);
});
/* Importeren: een eigen export (met groepen) of een gewoon schaatsersbestand (de bestandsnaam wordt
   dan de groep). Wordt samengevoegd met wat er al staat; "Ongedaan maken" zet alles terug. */
function importMine(file) {
  if (file.size > MAX_FILE_BYTES) return mineInfo('Kon bestand niet lezen: bestand is groter dan 1 MB');
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const list = parseSkaterFile(rd.result, { max: MAX_MINE, keepGroups: true });
      const j = JSON.parse(rd.result);
      const own = j && j.format === MINE_FORMAT;
      const fname = cleanGroupName(String(file.name).replace(/\.json$/i, '')) || 'Geïmporteerd';
      const backup = mineBackup(),
        m = state.mine;
      let skipped = 0;
      // groep alleen aanmaken als er nog ruimte is; geeft aan of de groep (nu) bestaat
      const ensure = (g) => {
        if (!m.groups.includes(g) && m.groups.length < MAX_GROUPS) m.groups.push(g);
        return m.groups.includes(g);
      };
      if (own && Array.isArray(j.groups)) j.groups.map(cleanGroupName).filter(Boolean).forEach(ensure);
      let added = 0,
        updated = 0;
      for (const f of list) {
        const groups = (own ? f.groups : [fname]).filter(ensure);
        const cur = mineById(f.id);
        if (cur) {
          if (f.birth) cur.birth = f.birth;
          if (f.category) Object.assign(cur, { category: f.category, catSeason: f.catSeason });
          cur.givenname = cur.givenname || f.givenname;
          cur.familyname = cur.familyname || f.familyname;
          cur.groups = [...new Set([...cur.groups, ...groups])];
          updated++;
        } else if (m.skaters.length < MAX_MINE) {
          m.skaters.push({ ...f, groups });
          added++;
        } else skipped++;
      }
      state.mineView = !own ? 'g:' + fname : '*';
      setMine(m);
      mineInfo(
        `${file.name}: ${added} nieuw, ${updated} bijgewerkt` +
          (skipped ? `, ${skipped} overgeslagen (maximaal ${MAX_MINE})` : '') +
          '.',
      );
      showToast(`Geïmporteerd: ${added} nieuw, ${updated} bijgewerkt`, 'Ongedaan maken', () =>
        setMine(backup),
      );
    } catch (err) {
      mineInfo('Kon bestand niet lezen: ' + err.message);
    }
  };
  rd.readAsText(file);
}
$('mineImp').addEventListener('click', () => $('mineFile').click());
$('mineFile').addEventListener('change', (e) => {
  if (e.target.files[0]) importMine(e.target.files[0]);
  e.target.value = '';
});
['dragover', 'dragenter'].forEach((t) =>
  $('mineCard').addEventListener(t, (e) => {
    e.preventDefault();
    $('mineCard').style.outline = '2px dashed var(--accent)';
  }),
);
['dragleave', 'drop'].forEach((t) =>
  $('mineCard').addEventListener(t, (e) => {
    e.preventDefault();
    $('mineCard').style.outline = '';
  }),
);
$('mineCard').addEventListener('drop', (e) => {
  const f = e.dataTransfer.files[0];
  if (f) importMine(f);
});

/* ---------- Nieuwe PR's van Mijn schaatsers sinds je vorige bezoek (vanaf v86) ----------
   Bij het openen van de app haalt de app voor elke schaatser in Mijn schaatsers de PR's op: één verzoek
   personal_records voor alle afstanden, plus skater_results voor 100 en 300 m (die rapporteert
   SpeedskatingResults niet als PR). Alles 6 uur bewaard en via de wachtrij (max. 4 tegelijk).
   Per schaatser en afstand onthoudt de app het laatst geziene PR (ssr.seen.v1). Is het PR nu sneller,
   dan is het een nieuw PR: badge op de knop Mijn schaatsers en een lijst bovenin het beheer. Pas na
   "Alles gezien" of × bij een regel wordt het geziene PR bijgewerkt. De eerste keer (of voor een net
   toegevoegde schaatser) legt de app alleen vast, zonder melding. Zelf ingevoerde tijden tellen niet mee. */
const LS_PRS = 'ssr.prs.v1', // {id: {t, d: {afstand: race}}}: PR's uit personal_records (6 uur)
  LS_SEEN = 'ssr.seen.v1'; // {id: {afstand: seconden | null}}: laatst gezien PR (null = geen tijd)
const PR_OWN_DIST = [100, 300]; // niet in personal_records: apart via skater_results
/* Opgeslagen PR-lijsten: alleen geldige ID's, afstanden en races */
function cleanPrs(x) {
  const out = {};
  if (!x || typeof x !== 'object') return out;
  for (const [k, v] of Object.entries(x)) {
    const id = cleanId(k);
    if (id == null || !v || typeof v.t !== 'number' || !v.d || typeof v.d !== 'object') continue;
    const d = {};
    for (const [dk, r] of Object.entries(v.d)) {
      const row = DISTANCES.includes(+dk) ? cleanResult(r) : null;
      if (row) d[+dk] = row;
    }
    out[id] = { t: v.t, d };
  }
  return out;
}
/* Geziene PR's: per schaatser per afstand een tijd in seconden of null */
function cleanSeen(x) {
  const out = {};
  if (!x || typeof x !== 'object') return out;
  for (const [k, v] of Object.entries(x)) {
    const id = cleanId(k);
    if (id == null || !v || typeof v !== 'object') continue;
    const o = {};
    for (const [dk, sec] of Object.entries(v))
      if (DISTANCES.includes(+dk) && (sec === null || (typeof sec === 'number' && sec > 0 && sec < 100000)))
        o[+dk] = sec;
    out[id] = o;
  }
  return out;
}
const prs = cleanPrs(load(LS_PRS, {})),
  seen = cleanSeen(load(LS_SEEN, {}));
const prNow = {}; // id -> {afstand: race | null}: de nu bekende PR's op de gecontroleerde afstanden
let newPrToastShown = false;
/* PR's van één schaatser uit personal_records (zonder 100/300 m); bij een fout de oude lijst */
async function getRecords(id) {
  const c = prs[id];
  if (c && Date.now() - c.t < CACHE_MS) return c.d;
  try {
    const j = JSON.parse(
      await limited(() => fetchText(`${API}json/personal_records.php?skater=${cleanId(id)}`)),
    );
    const d = {};
    for (const r of Array.isArray(j && j.records) ? j.records : []) {
      const dist = +(r && r.distance),
        row = cleanResult(r);
      if (!row || !DISTANCES.includes(dist) || PR_OWN_DIST.includes(dist)) continue;
      if (!d[dist] || row.sec < d[dist].sec) d[dist] = row;
    }
    prs[id] = { t: Date.now(), d };
    save(LS_PRS, prs);
    return d;
  } catch (err) {
    if (c) return c.d; // server traag of onbereikbaar: dan de vorige lijst
    throw err;
  }
}
/* Snelste race uit een lijst, of null */
function fastest(rows) {
  return rows.reduce((a, b) => (!a || b.sec < a.sec ? b : a), null);
}
/* Alle schaatsers van Mijn schaatsers controleren. Draait er al een controle, dan daarna nog een keer
   (bijv. als er intussen iemand aan Mijn schaatsers is toegevoegd). */
let prCheck = null,
  prCheckAgain = false;
function checkNewPRs() {
  if (prCheck) {
    prCheckAgain = true;
    return prCheck;
  }
  prCheck = (async () => {
    const ids = state.mine.skaters.map((s) => s.id);
    await Promise.all(
      ids.map(async (id) => {
        const cur = {};
        try {
          const rec = await getRecords(id);
          for (const d of DISTANCES) if (!PR_OWN_DIST.includes(d)) cur[d] = rec[d] || null;
        } catch (err) {
          console.warn('PR-lijst niet opgehaald voor', id, err);
        }
        for (const d of PR_OWN_DIST)
          try {
            cur[d] = fastest(await getResults(id, d));
          } catch (err) {
            console.warn('Tijden niet opgehaald voor', id, d, err);
          }
        prNow[id] = cur;
        // nog niet gecontroleerde afstanden (of een nieuwe schaatser): alleen vastleggen, geen melding
        const sn = seen[id] || (seen[id] = {});
        for (const [d, r] of Object.entries(cur)) if (!(d in sn)) sn[d] = r ? +r.sec.toFixed(2) : null;
      }),
    );
    // geziene PR's en PR-lijsten van schaatsers die niet meer in Mijn schaatsers staan, opruimen
    const keep = new Set(state.mine.skaters.map((s) => s.id));
    for (const id of Object.keys(seen)) if (!keep.has(+id)) delete seen[id];
    for (const id of Object.keys(prs)) if (!keep.has(+id)) delete prs[id];
    for (const id of Object.keys(prNow)) if (!keep.has(+id)) delete prNow[id];
    save(LS_SEEN, seen);
    save(LS_PRS, prs);
    renderNewPRs();
    const n = newPRList().length;
    if (n && !newPrToastShown) {
      newPrToastShown = true;
      showToast(`${n} ${n === 1 ? 'nieuw PR' : "nieuwe PR's"} van je schaatsers`, 'Bekijken', openMine);
    }
  })().finally(() => {
    prCheck = null;
    if (prCheckAgain) {
      prCheckAgain = false;
      checkNewPRs();
    }
  });
  return prCheck;
}
/* Nieuwe PR's: sneller dan het geziene PR (of de eerste tijd op een afstand), nieuwste eerst */
function newPRList() {
  const out = [];
  for (const s of state.mine.skaters) {
    const cur = prNow[s.id],
      sn = seen[s.id];
    if (!cur || !sn) continue;
    for (const [d, r] of Object.entries(cur)) {
      if (!r || !(d in sn)) continue;
      const prev = sn[d];
      if (prev == null || r.sec < prev - 0.005) out.push({ s, d: +d, r, prev });
    }
  }
  return out.sort((a, b) => (a.r.date < b.r.date ? 1 : a.r.date > b.r.date ? -1 : byName(a.s, b.s)));
}
/* Een nieuw PR (of alle) als gezien markeren */
function markSeen(list) {
  for (const { s, d, r } of list) (seen[s.id] || (seen[s.id] = {}))[d] = +r.sec.toFixed(2);
  save(LS_SEEN, seen);
  renderNewPRs();
}
/* Badge op de knop Mijn schaatsers en de lijst bovenin het beheer */
function renderNewPRs() {
  const list = newPRList(),
    n = list.length;
  for (const b of [$('prBadge'), $('prBadgeM')]) {
    b.hidden = !n;
    b.textContent = n > 99 ? '99+' : n;
  }
  $('mineBtn').title = n
    ? `Mijn schaatsers: ${n} ${n === 1 ? 'nieuw PR' : "nieuwe PR's"}`
    : 'Mijn schaatsers beheren';
  const el = $('newPrs');
  el.hidden = !n;
  if (!n) {
    el.innerHTML = '';
    return;
  }
  const yr = todayStr().slice(0, 4);
  el.innerHTML =
    `<div class="nphead"><b>Nieuwe PR's (${n})</b><button type="button" class="small ghost" data-act="npall">Alles gezien</button></div>` +
    list
      .map(({ s, d, r, prev }, i) => {
        const gain =
          prev == null
            ? 'eerste tijd'
            : `vorig ${fmtTime(prev)} · −${(prev - r.sec).toFixed(2).replace('.', ',')} s (−${(((prev - r.sec) / prev) * 100).toFixed(1).replace('.', ',')}%)`;
        const when = r.date.startsWith(yr) ? fmtDateNL(r.date).replace(' ' + yr, '') : fmtDateNL(r.date);
        return `<div class="npr" data-i="${i}" role="button" tabindex="0" title="Toevoegen aan de selectie en ${d} m openen">
      <div><div>${esc(s.givenname)} ${esc(s.familyname)} · ${d} m <b>${esc(fmtTime(r.sec))}</b></div>
      <div class="meta">${esc(gain)} · ${esc(when)} · ${esc(r.location)}</div></div>
      <button type="button" class="x" data-act="npseen" title="Gezien">×</button></div>`;
      })
      .join('');
  el._list = list; // voor de klik-afhandeling
}
/* Klik op een nieuw PR: schaatser aan de selectie toevoegen en die afstand openen */
function openNewPR(p) {
  state.distance = p.d; // eerst de afstand, zodat addSkaterList() meteen de goede tijden ophaalt
  syncDistTabs();
  fillMaxT();
  prWho = p.s.id; // PR-verloop toont deze schaatser
  addSkaterList([{ ...p.s, groups: [] }], $('listInfo')); // tekent opnieuw en haalt tijden op
  if (MQ_MOBILE.matches) setMobileTab('chart');
  else closeMine();
}
$('newPrs').addEventListener('click', (e) => {
  const el = $('newPrs'),
    list = el._list || [];
  if (e.target.closest('[data-act=npall]')) return markSeen(list);
  const row = e.target.closest('.npr');
  if (!row) return;
  const p = list[+row.dataset.i];
  if (!p) return;
  if (e.target.closest('[data-act=npseen]')) markSeen([p]);
  else openNewPR(p);
});
$('newPrs').addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('npr')) {
    e.preventDefault();
    const p = ($('newPrs')._list || [])[+e.target.dataset.i];
    if (p) openNewPR(p);
  }
});

/* ---------- ingebouwde lijst topschaatsers (publiek bekende sporters) ---------- */
// De lijst topschaatsers (TOP_GROUP en TOP_SKATERS) staat in data.js
// Omzetten naar hetzelfde formaat als schaatsers uit een bestand
const topList = TOP_SKATERS.map(([id, giv, fam, g, b, land]) => ({
  id,
  givenname: giv,
  familyname: fam,
  gender: g,
  country: land || 'NED',
  category: null,
  catSeason: null,
  birth: normBirth(b),
  groups: [TOP_GROUP],
}));
/* Keuzelijst "Uit lijst" (vanaf v68): bovenaan Mijn schaatsers (groepen en namen), daaronder de
   topschaatsers. Wordt opnieuw gevuld als Mijn schaatsers verandert (via renderMine()); de keuze blijft
   staan zolang die nog bestaat. Waarden: m* / mg:groep / ms:id (eigen) en * / g:groep / s:id (top). */
function fillListSel() {
  const sel = $('listSel'),
    prev = sel.value,
    m = state.mine;
  const opt = (v, t) => `<option value="${esc(v)}">${esc(t)}</option>`;
  const names = (list, pre) =>
    list
      .map((s) =>
        opt(
          pre + s.id,
          `${s.givenname} ${s.familyname}${s.country && s.country !== 'NED' ? ' (' + s.country + ')' : ''}`,
        ),
      )
      .join('');
  const mineOpts = m.skaters.length
    ? '<optgroup label="Mijn schaatsers – groepen">' +
      opt('m*', `Alle mijn schaatsers (${m.skaters.length})`) +
      m.groups
        .map((g) => [g, m.skaters.filter((s) => s.groups.includes(g)).length])
        .filter(([, n]) => n)
        .map(([g, n]) => opt('mg:' + g, `${g} (${n})`))
        .join('') +
      '</optgroup>' +
      '<optgroup label="Mijn schaatsers">' +
      names([...m.skaters].sort(byName), 'ms:') +
      '</optgroup>'
    : '<optgroup label="Mijn schaatsers"><option value="" disabled>Nog leeg – bewaar schaatsers via “+ Mijn schaatsers”</option></optgroup>';
  sel.innerHTML =
    '<option value="">Kies een schaatser of groep…</option>' +
    mineOpts +
    '<optgroup label="Topschaatsers">' +
    opt('*', `Alle topschaatsers (${topList.length})`) +
    names([...topList].sort(byName), 's:') +
    '</optgroup>';
  sel.value = prev;
  if (sel.value !== prev) sel.value = '';
}
fillListSel();
/* De schaatser(s) die bij de keuze in "Uit lijst" horen, in het formaat van addSkaterList().
   Bij een eigen groep krijgen ze alleen die groep als label, anders al hun eigen groepen. */
function chosenListSkaters() {
  const v = $('listSel').value,
    mine = state.mine.skaters;
  if (v === 'm*') return [...mine].sort(byName);
  if (v.startsWith('mg:'))
    return mine
      .filter((s) => s.groups.includes(v.slice(3)))
      .sort(byName)
      .map((s) => ({ ...s, groups: [v.slice(3)] }));
  if (v.startsWith('ms:')) return mine.filter((s) => s.id === +v.slice(3));
  if (v === '*') return topList;
  if (v.startsWith('s:')) return topList.filter((s) => s.id === +v.slice(2));
  return [];
}
/* Vanaf v82: een keuze in "Uit lijst" wordt meteen toegevoegd (geen knop Toevoegen meer). Daarna
   springt de lijst terug naar "Kies een schaatser of groep…", zodat je direct de volgende kunt kiezen. */
$('listSel').addEventListener('change', () => {
  const list = chosenListSkaters();
  if (!list.length) return;
  addSkaterList(list, $('listInfo'));
  $('listSel').value = '';
});
$('listManage').addEventListener('click', () => openMine());

$('saveSel').addEventListener('click', () => {
  if (!state.selected.length) {
    showToast('Er is niets geselecteerd om op te slaan.');
    return;
  }
  const doc = {
    format: FILE_FORMAT,
    description: 'Selectie uit de Schaatsvergelijker',
    created: new Date().toISOString().slice(0, 10),
    skaters: state.selected.map((s) => ({
      id: s.id,
      name: `${s.givenname} ${s.familyname}`.trim(),
      givenname: s.givenname,
      familyname: s.familyname,
      gender: s.gender || null,
      country: s.country || null,
      birth: s.birth ? s.birth.slice(0, 7) : null,
      category: s.category ?? null,
      catSeason: s.catSeason ?? null,
    })),
  };
  downloadJson(doc, `schaatsers-${doc.created}.json`);
});
/* Object als JSON-bestand downloaden (zonder server: via een tijdelijke link) */
function downloadJson(doc, fileName) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
/* Melding onderin met eventueel een knop (vanaf v59); verdwijnt na 8 seconden */
let toastTimer = null;
function showToast(text, btnText, onBtn) {
  const el = $('toast');
  el.innerHTML = esc(text) + (btnText ? ` <button type="button">${esc(btnText)}</button>` : '');
  el.hidden = false;
  const b = el.querySelector('button');
  if (b)
    b.addEventListener('click', () => {
      hideToast();
      onBtn();
    });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 8000);
}
function hideToast() {
  clearTimeout(toastTimer);
  $('toast').hidden = true;
}
/* "Alles wissen": selectie leegmaken, met "Ongedaan maken" in de melding */
function setSelection(list) {
  state.selected = list;
  persistSel();
  renderResults(lastResults);
  renderSelected();
  refresh();
}
$('clearSel').addEventListener('click', () => {
  if (!state.selected.length) return;
  const backup = state.selected;
  setSelection([]);
  showToast(
    `Selectie gewist (${backup.length} ${backup.length === 1 ? 'schaatser' : 'schaatsers'})`,
    'Ongedaan maken',
    () => setSelection(backup),
  );
});

/* ---------- Blok "Geselecteerd": kaartjes per schaatser ---------- */
/* Bouw de kaartjes van alle geselecteerde schaatsers opnieuw op */
function renderSelected() {
  const el = $('selected');
  renderMine(); // vinkjes "staat in de selectie" bij Mijn schaatsers bijwerken
  if (!state.selected.length) {
    el.innerHTML = '<div class="empty" style="padding:10px">Nog niemand geselecteerd.</div>';
    return;
  }
  el.innerHTML = state.selected
    .map((s) => {
      const b = birthOf(s);
      const selY = s.birth ? +s.birth.slice(0, 4) : s.draftY || '';
      const selM = s.birth ? +s.birth.slice(5, 7) : s.draftM || '';
      const { monthSel, yearSel } = birthSelects(s, selY, selM);
      const est = b ? (b.span > 1 ? '±' + Math.ceil(b.span / 2) + ' jr' : '±6 mnd') : '';
      const own = ownTimesHtml(s);
      /* Vanaf v71: een ingevulde geboortedatum staat met de leeftijd achter de naam (klikbaar om te
         wijzigen). De rij "Geboren" met keuzelijsten staat er alleen bij een onbekende datum of tijdens
         het wijzigen. */
      const birthRow = !s.birth || editBirth.has(s.id);
      let born = '';
      if (!birthRow) {
        const a = ageParts(parseDate(s.birth), parseDate(todayStr()));
        born = `<span class="born"><button type="button" class="birthlink" data-act="bedit" title="Geboortemaand; klik om te wijzigen">${MONTHS[+s.birth.slice(5, 7) - 1]} ${s.birth.slice(0, 4)}</button> · ${a.y} jr ${a.m} mnd</span>`;
      }
      const rows =
        (birthRow
          ? `<span class="k">Geboren</span><span class="bsel">${monthSel}${yearSel}${s.birth ? '<button class="small" data-act="bdone" title="Klaar met wijzigen">Klaar</button><button class="x" data-act="bclear" title="Geboortedatum wissen">×</button>' : ''}</span>` +
            (!s.birth && (s.draftY || s.draftM)
              ? `<span></span><span class="warn">Kies ook ${s.draftY ? 'de maand' : 'het jaar'}</span>`
              : '') +
            (!s.birth && b
              ? `<span></span><span class="warn">≈ geschat: ${b.date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })} (${est})</span>`
              : '')
          : '') + own.rows;
      return `<div class="sel${s.hl ? ' hl' : ''}" style="--c:${cleanColor(s.color) || '#888'}${genderOK(s) ? '' : ';opacity:.45'}" data-id="${Number(s.id)}" ${genderOK(s) ? '' : 'title="Verborgen door het filter heren/dames"'}>
      <div class="top"><span class="name">${esc(s.givenname)} ${esc(s.familyname)} <a class="prof" href="https://speedskatingresults.com/index.php?p=17&s=${Number(s.id)}" target="_blank" rel="noopener" title="Profiel op SpeedskatingResults" aria-label="Profiel op SpeedskatingResults">↗</a>${born}</span>
        <span><button class="star ${s.hl ? 'on' : ''}" data-act="hl" title="${s.hl ? 'Highlight uitzetten' : 'Highlighten: dikkere lijn in de grafiek'}">${s.hl ? '★' : '☆'}</button><button class="x" data-act="rm" title="Verwijderen">×</button></span></div>
      <div class="meta">${esc(catLabel(s))}${
        s.group
          ? ' ' +
            s.group
              .split(/,\s*/)
              .filter(Boolean)
              .map((g) => `<span class="chip" title="Groep">${esc(g)}</span>`)
              .join('')
          : ''
      }</div>
      ${rows ? `<div class="rows">${rows}</div>` : ''}
      <div class="addrow">${mineCardBtn(s)}${own.add}</div>
    </div>`;
    })
    .join('');
}
/* ---------- Zelf ingevoerde tijden op het kaartje ---------- */
/* Open invoerregels per schaatser-ID: {dist, time, date, loc, err} (alleen in het geheugen,
   zodat getypte tekst blijft staan als het kaartje opnieuw wordt opgebouwd) */
const timeForm = new Map();
/* vandaag als "JJJJ-MM-DD" in de eigen tijdzone */
function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}
/* Getypte tijd -> "1.23,45"-notatie: ":" mag als minutenteken, een punt als decimaalteken
   ("46.10" -> "46,10"), en zonder decimalen worden het hele seconden ("46" -> "46,00") */
function normTimeInput(v) {
  let t = String(v || '')
    .replace(/\s/g, '')
    .replace(':', '.');
  if (!t.includes(',')) {
    const i = t.lastIndexOf('.');
    t = i >= 0 ? t.slice(0, i) + ',' + t.slice(i + 1) : t + ',00';
  }
  return parseTime(t);
}
/* Eigen tijden als rijen voor het raster op het kaartje ({rows}) plus de knop "+ tijd" ({add});
   met een open invoerregel staat het formulier in de rijen en vervalt de knop */
function ownTimesHtml(s) {
  const yr = todayStr().slice(0, 4);
  const own = state.manual
    .filter((m) => m.id === s.id)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.dist - b.dist));
  let rows = own
    .map(
      (m, i) =>
        `<span class="k">${i ? '' : 'Toegevoegd'}</span><span class="own" data-mid="${Number(m.mid)}" title="Zelf toegevoegd, nog niet op SpeedskatingResults"><span>${m.dist} m <b>${esc(m.time)}</b> · ${m.date.startsWith(yr) ? fmtDateNL(m.date).replace(' ' + yr, '') : fmtDateNL(m.date)} · ${m.loc ? `<span title="${esc(m.loc)}">${esc(RINK_SHORT[m.loc] || m.loc)}</span>` : 'buitenl.'}</span><button class="x" data-act="tdel" title="Zelf ingevoerde tijd verwijderen">×</button></span>`,
    )
    .join('');
  const f = timeForm.get(s.id);
  if (!f)
    return {
      rows,
      add: `<button type="button" class="ownadd" data-act="tadd" title="Zojuist gereden tijd invoeren die nog niet op SpeedskatingResults staat">+ tijd</button>`,
    };
  const rinks =
    `<option value="" ${f.loc === '' ? 'selected' : ''}>baan…</option>` +
    NL_RINKS.map((r) => `<option ${r === f.loc ? 'selected' : ''}>${esc(r)}</option>`).join('') +
    `<option value="-" ${f.loc === '-' ? 'selected' : ''}>buitenland/anders</option>`;
  rows += `<span class="k">Nieuwe tijd</span><span class="ownform">
        <select data-act="tf" data-f="dist" aria-label="Afstand">${DISTANCES.map((d) => `<option value="${d}" ${d === f.dist ? 'selected' : ''}>${d} m</option>`).join('')}</select>
        <input data-act="tf" data-f="time" inputmode="decimal" autocomplete="off" placeholder="46,10" value="${esc(f.time)}" aria-label="Tijd">
        <select data-act="tf" data-f="loc" aria-label="Baan">${rinks}</select></span>
        <span></span><span class="ownform"><input data-act="tf" data-f="date" type="date" max="${todayStr()}" value="${esc(f.date)}" aria-label="Datum">
        <button class="small" data-act="tsave">Opslaan</button><button type="button" class="ownadd" data-act="tcancel">Annuleren</button></span>
        ${f.err ? `<span></span><span class="warn">${esc(f.err)}</span>` : ''}`;
  return { rows, add: '' };
}
/* Invoerregel controleren en de tijd bewaren; bij een andere afstand naar dat tabblad gaan */
function saveOwnTime(id) {
  const f = timeForm.get(id);
  const sec = normTimeInput(f.time);
  if (sec == null || sec < f.dist / 18 || sec > f.dist)
    f.err = `Tijd niet herkend voor ${f.dist} m (bijv. 46,10 of 1.23,45).`;
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || f.date > todayStr())
    f.err = 'Kies een datum (vandaag of eerder).';
  else if (!f.loc) f.err = 'Kies de baan (nodig voor de ANS-correctie).';
  else f.err = '';
  if (f.err) {
    renderSelected();
    return;
  }
  state.manual.push({
    mid: Date.now(),
    id,
    dist: f.dist,
    time: fmtTime(sec),
    date: f.date,
    loc: f.loc === '-' ? '' : f.loc,
  });
  persistManual();
  ui.rink = f.loc;
  save(LS_UI, ui);
  timeForm.delete(id);
  renderSelected();
  if (f.dist !== state.distance) {
    const tab = $('distTabs').querySelector(`button[data-d="${f.dist}"]`);
    if (tab) tab.click();
  } else render();
}
/* getypte waarden direct onthouden */
function onOwnInput(e) {
  if (e.target.dataset.act !== 'tf') return;
  const f = timeForm.get(+e.target.closest('.sel').dataset.id);
  if (!f) return;
  const k = e.target.dataset.f;
  f[k] = k === 'dist' ? +e.target.value : e.target.value;
}
$('selected').addEventListener('input', onOwnInput);
$('selected').addEventListener('change', onOwnInput);
$('selected').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.dataset.act === 'tf') {
    e.preventDefault();
    onOwnInput(e);
    saveOwnTime(+e.target.closest('.sel').dataset.id);
  }
});
$('selected').addEventListener('click', (e) => {
  const ta = e.target.closest('[data-act=tadd],[data-act=tcancel],[data-act=tsave],[data-act=tdel]');
  if (ta) {
    const id = +ta.closest('.sel').dataset.id;
    const act = ta.dataset.act;
    if (act === 'tadd') {
      timeForm.set(id, { dist: state.distance, time: '', date: todayStr(), loc: ui.rink, err: '' });
      renderSelected();
      const inp = $('selected').querySelector(`.sel[data-id="${id}"] [data-f=time]`);
      if (inp) inp.focus();
    } else if (act === 'tcancel') {
      timeForm.delete(id);
      renderSelected();
    } else if (act === 'tsave') saveOwnTime(id);
    else {
      const mid = +ta.closest('.own').dataset.mid;
      state.manual = state.manual.filter((m) => m.mid !== mid);
      persistManual();
      renderSelected();
      render();
    }
    return;
  }
  // "+ Mijn schaatsers": bewaren in de gekozen groep; "✓ Mijn schaatsers": dat blok openen
  const mb = e.target.closest('[data-act=mine]');
  if (mb) {
    const s = state.selected.find((x) => x.id === +mb.closest('.sel').dataset.id);
    if (mineById(s.id)) openMine();
    else {
      const g = mineGroup();
      keepInMine([s], g);
      renderSelected();
      checkNewPRs(); // PR's van de nieuwe schaatser vastleggen (vanaf v86)
      showToast(`${s.givenname} ${s.familyname} bewaard in Mijn schaatsers${g ? ` (${g})` : ''}`);
    }
    return;
  }
  const hlb = e.target.closest('[data-act=hl]');
  if (hlb) {
    const s = state.selected.find((x) => x.id === +hlb.closest('.sel').dataset.id);
    s.hl = !s.hl;
    persistSel();
    renderSelected();
    render();
    return;
  }
  // klik op de geboortedatum: wijzigen; "Klaar": weer als tekst tonen
  const bed = e.target.closest('[data-act=bedit],[data-act=bdone]');
  if (bed) {
    const id = +bed.closest('.sel').dataset.id;
    if (bed.dataset.act === 'bedit') editBirth.add(id);
    else editBirth.delete(id);
    renderSelected();
    const sel = $('selected').querySelector(`.sel[data-id="${id}"] [data-act=bm]`);
    if (sel && bed.dataset.act === 'bedit') sel.focus();
    return;
  }
  const clr = e.target.closest('[data-act=bclear]');
  if (clr) {
    const s = state.selected.find((x) => x.id === +clr.closest('.sel').dataset.id);
    editBirth.delete(s.id);
    s.birth = null;
    s.draftY = s.draftM = null;
    persistSel();
    renderSelected();
    render();
    return;
  }
  const b = e.target.closest('[data-act=rm]');
  if (!b) return;
  const id = +b.closest('.sel').dataset.id;
  state.selected = state.selected.filter((s) => s.id !== id);
  persistSel();
  renderSelected();
  renderResults(lastResults);
  refresh();
});
$('selected').addEventListener('change', (e) => {
  const act = e.target.dataset.act;
  if (act !== 'by' && act !== 'bm') return;
  const card = e.target.closest('.sel');
  const s = state.selected.find((x) => x.id === +card.dataset.id);
  let y = +card.querySelector('[data-act=by]').value || null;
  let m = +card.querySelector('[data-act=bm]').value || null;
  ({ y, m } = resolveBirthPick(s, act, y, m));
  if (y && m) {
    s.birth = `${y}-${String(m).padStart(2, '0')}-15`; // maand bekend → midden van de maand
    s.draftY = s.draftM = null;
  } else {
    s.birth = null;
    s.draftY = y;
    s.draftM = m; // nog onvolledig: bewaar keuze, gebruik schatting
  }
  persistSel();
  renderSelected();
  render();
  const again = $('selected').querySelector(
    `.sel[data-id="${Number(s.id)}"] [data-act=${y && !m ? 'bm' : !y && m ? 'by' : act}]`,
  );
  if (again) again.focus();
});

/* ---------- Afstandsbalk en vinkjes boven de grafiek ----------
   Vanaf v72: knoppen per afstand en als laatste vakje de knop ANS. Op de pc (vanaf v73) staan alle
   afstanden als knop; op mobiel zitten 3000/5000/10000 (.dlong) in de uitklapknop 3k+, die de gekozen
   lange afstand toont ("5k"). De CSS bepaalt welke van de twee zichtbaar is. */
const LONG_DISTANCES = [3000, 5000, 10000];
$('distTabs').innerHTML =
  DISTANCES.map(
    (d) =>
      `<button type="button" data-d="${d}" aria-label="${d} m"${LONG_DISTANCES.includes(d) ? ' class="dlong"' : ''}>` +
      `<span class="dl">${d} m</span><span class="ds">${d}</span></button>`,
  ).join('') +
  `<div class="dmore"><button type="button" id="distMoreBtn" aria-haspopup="true" aria-expanded="false">` +
  `<span class="dl" id="distMoreL">3k+</span><span class="ds" id="distMoreS">3k+</span>` +
  `<span class="car" aria-hidden="true">▾</span></button>` +
  `<div class="dmenu" id="distMenu" role="menu" hidden>` +
  LONG_DISTANCES.map(
    (d) =>
      `<button type="button" role="menuitemradio" data-d="${d}">${d} m<span class="chk" aria-hidden="true">✓</span></button>`,
  ).join('') +
  `</div></div>` +
  `<button type="button" class="ansseg" id="ansBtn" aria-pressed="false" ` +
  `title="ANS: alleen tijden op Nederlandse banen uit de KNSB ANS-tabel, omgerekend naar een neutrale baan">` +
  `<span class="chk" aria-hidden="true">✓</span>ANS</button>`;
/* Gekozen afstand blauw maken; de uitklapknop is blauw en noemt de afstand als een lange afstand gekozen is */
function syncDistTabs() {
  $('distTabs')
    .querySelectorAll('button[data-d]')
    .forEach((x) => {
      const on = +x.dataset.d === state.distance;
      x.classList.toggle('on', on);
      if (x.getAttribute('role') === 'menuitemradio') x.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  const long = LONG_DISTANCES.includes(state.distance);
  $('distMoreBtn').classList.toggle('on', long);
  $('distMoreL').textContent = long ? `${state.distance} m` : '3k+';
  $('distMoreS').textContent = long ? `${state.distance / 1000}k` : '3k+';
  $('distMoreBtn').setAttribute(
    'aria-label',
    long ? `Lange afstand: ${state.distance} m` : 'Lange afstanden: 3000, 5000 of 10000 m',
  );
}
/* Menu van de uitklapknop openen of sluiten */
function openDistMenu(open) {
  $('distMenu').hidden = !open;
  $('distMoreBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
}
/* Knop ANS in de balk blauw met vinkje als ANS aan staat */
function syncAns() {
  $('ansBtn').classList.toggle('on', ui.ans);
  $('ansBtn').setAttribute('aria-pressed', ui.ans ? 'true' : 'false');
}
$('distTabs').addEventListener('click', (e) => {
  if (e.target.closest('#distMoreBtn')) {
    openDistMenu($('distMenu').hidden);
    return;
  }
  if (e.target.closest('#ansBtn')) {
    ui.ans = !ui.ans;
    save(LS_UI, ui);
    syncAns();
    render();
    return;
  }
  const b = e.target.closest('button[data-d]');
  if (!b) return;
  openDistMenu(false);
  state.distance = +b.dataset.d;
  syncDistTabs();
  fillMaxT();
  refresh();
});
// klik ergens anders of Escape: menu dicht
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dmore')) openDistMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('distMenu').hidden) {
    openDistMenu(false);
    $('distMoreBtn').focus();
  }
});
syncDistTabs();
/* PR-lijn en Alle tijden mogen niet allebei uit (vanaf v77): dan is de grafiek leeg. Zet je de laatste
   uit, dan gaat de andere aan. */
['showAll', 'showPR'].forEach((id) =>
  $(id).addEventListener('change', () => {
    if (!$('showAll').checked && !$('showPR').checked)
      $(id === 'showPR' ? 'showAll' : 'showPR').checked = true;
    render();
  }),
);
$('fastTop').addEventListener('change', render);

/* ---------- leeftijdsperiode ---------- */
const LS_UI = 'ssr.ui.v1';
const ui = cleanUi(load(LS_UI, {})); // gecontroleerd, zie cleanUi()
/* ---------- maximale tijd per afstand (stappen van 10 s op de 500 m, naar rato voor andere afstanden) ---------- */
function maxTStep(d) {
  return (10 * d) / 500;
}
function fmtShort(s) {
  return fmtTime(s).replace(/,00$/, '');
}
/* Vul de keuzelijst Max. tijd voor de gekozen afstand (3 t/m 20 stappen) */
function fillMaxT() {
  const d = state.distance,
    st = maxTStep(d),
    cur = ui.maxT[d] ?? null;
  let h = '<option value="">geen</option>';
  for (let i = 3; i <= 20; i++) {
    const v = +(i * st).toFixed(2);
    h += `<option value="${v}" ${v === cur ? 'selected' : ''}>${fmtShort(v)}</option>`;
  }
  $('maxT').innerHTML = h;
}
$('maxT').addEventListener('change', () => {
  const v = $('maxT').value;
  if (v === '') delete ui.maxT[state.distance];
  else ui.maxT[state.distance] = +v;
  save(LS_UI, ui);
  render();
});
/* ANS staat vanaf v72 als laatste vakje in de afstandsbalk (pc en mobiel); zie syncAns() */
syncAns();
/* Heren / Dames / Beide (vanaf v56; waren twee vinkjes). Twee keer "uit" kan zo niet meer. */
if (!ui.showM && !ui.showF) ui.showM = ui.showF = true;
function syncGenderSeg() {
  const g = ui.showM && !ui.showF ? 'm' : ui.showF && !ui.showM ? 'f' : 'all';
  $('genderSeg')
    .querySelectorAll('button')
    .forEach((b) => {
      b.classList.toggle('on', b.dataset.g === g);
      b.setAttribute('aria-pressed', b.dataset.g === g ? 'true' : 'false');
    });
}
syncGenderSeg();
$('genderSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-g]');
  if (!b) return;
  ui.showM = b.dataset.g !== 'f';
  ui.showF = b.dataset.g !== 'm';
  save(LS_UI, ui);
  syncGenderSeg();
  renderSelected();
  render();
});
/* "Filters wissen": leeftijdsperiode, max. tijd (alle afstanden) en heren/dames terug naar alles */
function filtersOn() {
  return ui.ageFrom != null || ui.ageTo != null || !!ui.maxT[state.distance] || !ui.showM || !ui.showF;
}
$('filterReset').addEventListener('click', () => {
  ui.ageFrom = ui.ageTo = null;
  ui.maxT = {};
  ui.showM = ui.showF = true;
  save(LS_UI, ui);
  $('ageFrom').value = '';
  $('ageTo').value = '';
  fillMaxT();
  syncGenderSeg();
  renderSelected();
  render();
});
/* geslachtsfilter (onbekend geslacht: altijd tonen) */
function genderOK(s) {
  return s.gender === 'm' ? ui.showM : s.gender === 'f' ? ui.showF : true;
}
/* Vul een leeftijd-keuzelijst met 5 t/m 80 jaar */
function fillAgeSel(el, val, emptyLabel) {
  let h = `<option value="">${emptyLabel}</option>`;
  for (let a = 5; a <= 80; a++) h += `<option value="${a}" ${a === val ? 'selected' : ''}>${a} jaar</option>`;
  el.innerHTML = h;
}
fillAgeSel($('ageFrom'), ui.ageFrom, 'begin');
fillAgeSel($('ageTo'), ui.ageTo, 'eind');
['ageFrom', 'ageTo'].forEach((id) =>
  $(id).addEventListener('change', () => {
    ui.ageFrom = $('ageFrom').value === '' ? null : +$('ageFrom').value;
    ui.ageTo = $('ageTo').value === '' ? null : +$('ageTo').value;
    if (ui.ageFrom != null && ui.ageTo != null && ui.ageTo < ui.ageFrom) {
      // houd van ≤ t/m
      if (document.activeElement && document.activeElement.id === 'ageFrom') ui.ageTo = ui.ageFrom;
      else ui.ageFrom = ui.ageTo;
      $('ageFrom').value = ui.ageFrom;
      $('ageTo').value = ui.ageTo;
    }
    save(LS_UI, ui);
    render();
  }),
);
function ageFilterOn() {
  return ui.ageFrom != null || ui.ageTo != null;
}
/* valt een race binnen de gekozen leeftijdsperiode? (zonder bekende leeftijd: altijd ja) */
function ageOK(s, dateStr) {
  if (!ageFilterOn()) return true;
  const b = birthOf(s);
  if (!b) return true;
  const a = ageParts(b.date, parseDate(dateStr)).y;
  return (ui.ageFrom == null || a >= ui.ageFrom) && (ui.ageTo == null || a <= ui.ageTo);
}
/* x-positie van het moment waarop schaatser s de leeftijd 'age' bereikt */
function ageBoundaryX(s, age) {
  if (state.xMode === 'age') return age;
  const b = birthOf(s).date;
  return decYear(new Date(Date.UTC(b.getUTCFullYear() + age, b.getUTCMonth(), b.getUTCDate())));
}

/* ---------- Tijden ophalen voor de gekozen afstand ---------- */
/* Haal ontbrekende tijden op voor de gekozen afstand en teken daarna opnieuw */
async function refresh() {
  const d = state.distance;
  const todo = state.selected.filter((s) => state.data[`${s.id}_${d}`] === undefined);
  render();
  if (!todo.length) return;
  $('loadStatus').textContent = `Laden (${todo.length})…`;
  const jobs = todo.map(async (s) => {
    const key = `${s.id}_${d}`;
    state.data[key] = 'loading';
    try {
      state.data[key] = await getResults(s.id, d);
    } catch (err) {
      state.data[key] = 'error';
      console.warn(err);
    }
    if (d === state.distance) renderSoon(); // grafiek tussentijds bijwerken
  });
  await Promise.all(jobs);
  if (d === state.distance) {
    clearTimeout(renderTimer);
    renderTimer = null;
    $('loadStatus').textContent = '';
    render();
  }
  pruneManual();
}
/* Tijdens het laden de grafiek hoogstens eens per seconde opnieuw tekenen,
   zodat binnengekomen schaatsers meteen zichtbaar zijn zonder op de traagste te wachten */
let renderTimer = null;
function renderSoon() {
  if (renderTimer) return;
  renderTimer = setTimeout(() => {
    renderTimer = null;
    render();
  }, 1000);
}
/* Schaatsers met een fout of met oude cache opnieuw ophalen (knop "Opnieuw proberen") */
function retryFailed() {
  const d = state.distance;
  for (const s of state.selected) {
    const key = `${s.id}_${d}`;
    if (state.data[key] === 'error' || state.stale[key]) delete state.data[key];
  }
  refresh();
}

/* Zelf ingevoerde tijden van schaatser id op afstand d als gewone rijen, zonder de tijden
   die al in de API-rijen staan (zelfde datum, verschil < 0,015 s) */
function manualRows(id, d, api) {
  return state.manual
    .filter((m) => m.id === id && m.dist === d && !manualMatch(m, api))
    .map((m) => ({
      time: m.time,
      sec: parseTime(m.time),
      date: m.date,
      location: m.loc ? `${m.loc} (NED)` : 'buitenland/anders',
      name: 'Zelf ingevoerd (nog niet op SpeedskatingResults)',
      link: null,
      manual: true,
    }));
}
function manualMatch(m, api) {
  const sec = parseTime(m.time);
  return api.some((r) => r.date === m.date && Math.abs(r.sec - sec) < 0.015);
}
function persistManual() {
  save(LS_MANUAL, state.manual);
}
/* Ruim zelf ingevoerde tijden op die inmiddels via SpeedskatingResults binnen zijn */
function pruneManual() {
  const before = state.manual.length;
  state.manual = state.manual.filter((m) => {
    const api = state.data[`${m.id}_${m.dist}`];
    return !(Array.isArray(api) && manualMatch(m, api));
  });
  if (state.manual.length !== before) {
    persistManual();
    renderSelected();
  }
}

/* tijden van schaatser s op afstand d zoals ze getoond worden (met ANS-filter/correctie) */
function rowsFor(s, d) {
  let rows = state.data[`${s.id}_${d}`];
  const own = manualRows(s.id, d, Array.isArray(rows) ? rows : []);
  if (!Array.isArray(rows)) {
    if (rows === 'error' && own.length)
      rows = []; // server onbereikbaar: eigen tijden toch tonen
    else return rows;
  }
  if (own.length)
    rows = [...rows, ...own].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.sec - b.sec));
  if (ui.ans)
    rows = rows
      .map((r) => {
        const p = ansPct(r.location, d);
        return p == null ? null : { ...r, raw: r.sec, ansPct: p, sec: r.sec * (1 - p / 100) };
      })
      .filter(Boolean);
  const mt = ui.maxT[d];
  if (mt) rows = rows.filter((r) => r.sec <= mt); // filter na ANS: de getoonde tijd telt
  return rows;
}

/* Afstandstabbladen grijs als al bekend is dat geen enkele (zichtbare) schaatser daar tijden heeft
   (vanaf v59). Alleen afstanden die al zijn opgehaald tellen mee (rowsFor(), met ANS en max. tijd);
   de rest blijft gewoon. Een zelf ingevoerde tijd telt als data. De PR-lijst per schaatser (v65–v77)
   is in v78 vervallen: andere afstanden worden pas opgehaald als je op het tabblad klikt. */
function markEmptyDistances() {
  const sel = state.selected.filter(genderOK);
  const noTimes = (s, d) => {
    if (Array.isArray(state.data[`${s.id}_${d}`])) return !rowsFor(s, d).length;
    return false; // nog niet opgehaald: onbekend, dus niet grijs
  };
  document.querySelectorAll('#distTabs button[data-d]').forEach((b) => {
    const d = +b.dataset.d;
    const empty = sel.length && sel.every((s) => noTimes(s, d));
    b.classList.toggle('nodata', !!empty);
    b.title = empty ? 'Geen tijden van je selectie op deze afstand' : '';
  });
  // uitklapknop 3k+ grijs als geen van de drie lange afstanden tijden heeft (vanaf v72)
  const longEmpty = sel.length && LONG_DISTANCES.every((d) => sel.every((s) => noTimes(s, d)));
  $('distMoreBtn').classList.toggle('nodata', !!longEmpty);
  $('distMoreBtn').title = longEmpty ? 'Geen tijden van je selectie op 3000, 5000 en 10000 m' : '';
}

/* ---------- Grafiek ---------- */
let chart;
/* Snelheidsschaal (vast sinds v31): de grafiek plot 1/tijd, wat evenredig is met de snelheid in km/u.
   Daardoor neemt een verbetering bij een snelle tijd meer ruimte in dan dezelfde procentuele
   verbetering bij een langzame tijd. Langs de as staan wel gewoon tijden. */
const yT = (t) => 1 / t; // tijd -> waarde op de as
const yInv = (v) => 1 / v; // waarde op de as -> tijd
/* ronde tijd-ticks: de as-waarden zijn geen tijden, dus Chart.js' eigen ticks zijn onbruikbaar */
function niceTimeTicks(scale) {
  let lo = yInv(scale.min),
    hi = yInv(scale.max);
  if (lo > hi) [lo, hi] = [hi, lo];
  // Bijna gelijke grenzen (bijv. alleen dezelfde tijd, met een afrondingsverschil) gaven
  // een eindeloze of enorme lus met ticks: dan Chart.js' eigen ticks laten staan.
  if (!(hi > lo) || !isFinite(hi) || hi - lo < hi * 1e-6) return;
  const raw = (hi - lo) / 8,
    p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) || 10 * p;
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6 && ticks.length < 50; v += step)
    ticks.push({ value: yT(+v.toFixed(6)) });
  scale.ticks = ticks;
}
/* ---------- namen aan het eind van de lijnen ---------- */
const LBL_FONT = (hl) => `${hl ? '700' : '500'} 10px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`;
const LBL_STEP = 11; // verticale afstand (px) tussen namen die elkaar zouden raken (v42: was 13 bij 12px)
let _mctx;
/* breedte van een naam in pixels (om rechts genoeg ruimte te maken) */
function labelWidth(text, hl) {
  _mctx = _mctx || document.createElement('canvas').getContext('2d');
  _mctx.font = LBL_FONT(hl);
  return _mctx.measureText(text).width;
}
/* Chart.js-plugin: schrijft de naam van elke schaatser rechts van het laatste punt van zijn lijn.
   Namen die elkaar zouden raken, schuiven LBL_STEP px uit elkaar. */
const endLabels = {
  id: 'endLabels',
  afterDatasetsDraw(ch) {
    const ctx = ch.ctx,
      area = ch.chartArea,
      items = [];
    ch.data.datasets.forEach((ds, i) => {
      if (!ds._lbl || !ch.isDatasetVisible(i)) return;
      const els = ch.getDatasetMeta(i).data;
      if (!els.length) return;
      const last = els.reduce((a, b) => (b.x >= a.x ? b : a)); // punt met de grootste leeftijd
      items.push({
        x: last.x,
        y: last.y,
        text: ds._lbl,
        color: ds.borderColor,
        hl: ds._hl,
        w: labelWidth(ds._lbl, ds._hl),
        sid: ds._sid,
      });
    });
    // overlap voorkomen: labels die horizontaal overlappen minstens LBL_STEP px uit elkaar
    items.sort((a, b) => a.y - b.y);
    // Let op: vergelijken met < LBL_STEP - 0.5 en niet < LBL_STEP. Door afronding kon
    // (o.ly + LBL_STEP) - o.ly net kleiner uitkomen, waardoor deze lus eindeloos bleef draaien (v37).
    const placed = [];
    for (const it of items) {
      let y = Math.min(Math.max(it.y, area.top + 6), area.bottom - 6);
      for (let k = 0, guard = 0; k < placed.length && guard < 10000; k++, guard++) {
        const o = placed[k];
        if (Math.abs(it.x + 6 - (o.x + 6)) < Math.max(it.w, o.w) + 6 && Math.abs(y - o.ly) < LBL_STEP - 0.5) {
          y = o.ly + LBL_STEP;
          k = -1; // opnieuw controleren tegen alle al geplaatste namen
        }
      }
      it.ly = y;
      placed.push(it);
    }
    // plek van elke naam onthouden, zodat een klik op de naam de schaatser kan highlighten
    ch._lblBoxes = placed.map((it) => ({
      x0: it.x + 4,
      x1: it.x + 8 + it.w,
      y0: it.ly - LBL_STEP / 2,
      y1: it.ly + LBL_STEP / 2,
      sid: it.sid,
    }));
    ctx.save();
    ctx.textBaseline = 'middle';
    for (const it of placed) {
      ctx.font = LBL_FONT(it.hl);
      ctx.lineWidth = 3;
      ctx.strokeStyle = cssVar('--card') || '#fff'; // halo in de achtergrondkleur
      ctx.strokeText(it.text, it.x + 6, it.ly);
      ctx.fillStyle = it.color;
      ctx.fillText(it.text, it.x + 6, it.ly);
    }
    ctx.restore();
  },
  // Chart.js roept onClick/onHover alleen aan binnen het grafiekvlak. Namen die rechts náást de
  // grafiek staan (in de marge), vangen we hier zelf af: klik = highlight, en een handje bij hover.
  afterEvent(ch, args) {
    if (args.inChartArea) return;
    const e = args.event;
    const id = chartHitSkater(ch, e.x, e.y);
    if (e.type === 'mousemove') ch.canvas.style.cursor = id != null ? 'pointer' : '';
    else if (e.type === 'click' && id != null) setTimeout(() => toggleHighlight(id), 0);
  },
};
/* Welke schaatser zit er onder de muis? Volgorde: naam aan de lijn, stip, stuk PR-lijn (binnen 5 px).
   Geeft het schaatser-ID of null. x en y zijn pixels binnen het canvas. */
function chartHitSkater(ch, x, y) {
  for (const b of ch._lblBoxes || []) if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return b.sid;
  const pts = ch.getElementsAtEventForMode({ x, y, native: true }, 'nearest', { intersect: true }, false);
  if (pts.length) return ch.data.datasets[pts[0].datasetIndex]._sid ?? null;
  // lijnstukken: bij stepped 'before' eerst horizontaal op de oude y, dan verticaal bij de nieuwe x
  let best = null,
    bestD = 5;
  ch.data.datasets.forEach((ds, i) => {
    if (!ds.showLine || !ch.isDatasetVisible(i)) return;
    const els = ch.getDatasetMeta(i).data;
    for (let k = 1; k < els.length; k++) {
      const a = els[k - 1],
        b = els[k];
      const dH =
        x >= Math.min(a.x, b.x) - bestD && x <= Math.max(a.x, b.x) + bestD ? Math.abs(y - a.y) : Infinity;
      const dV =
        y >= Math.min(a.y, b.y) - bestD && y <= Math.max(a.y, b.y) + bestD ? Math.abs(x - b.x) : Infinity;
      const dd = Math.min(dH, dV);
      if (dd < bestD) {
        bestD = dd;
        best = ds._sid;
      }
    }
  });
  return best;
}
/* Highlight (ster) van een schaatser aan/uit zetten, vanuit de grafiek */
function toggleHighlight(id) {
  const s = state.selected.find((x) => x.id === id);
  if (!s) return;
  s.hl = !s.hl;
  persistSel();
  renderSelected();
  render();
}

/* x-positie van een race: de leeftijd van de schaatser op die dag */
function pointX(sk, r) {
  const d = parseDate(r.date);
  if (state.xMode === 'date') return decYear(d);
  const b = birthOf(sk);
  return b ? ageDecimal(b.date, d) : null;
}
/* Teken de grafiek opnieuw: per schaatser een PR-lijn (trap) en eventueel alle losse tijden.
   Houdt rekening met alle filters (m/v, leeftijdsperiode, max. tijd, ANS) en met de schaal. */
function render() {
  renderMobileBits();
  const d = state.distance;
  const showAll = $('showAll').checked,
    showPR = $('showPR').checked,
    fastTop = $('fastTop').checked;
  const datasets = [];
  const missingAge = [];
  /* highlight: gemarkeerde schaatsers dik en bovenop, de rest dunner */
  const anyHL = state.selected.some((s) => s.hl && genderOK(s));
  const lw = (s) => (s.hl ? 3 : anyHL ? 1 : 1.5),
    pr0 = (s) => (s.hl ? 3.5 : anyHL ? 1.5 : 2.5),
    dot0 = (s) => (s.hl ? 3 : anyHL ? 1.5 : 2);
  for (const s of state.selected) {
    if (!genderOK(s)) continue;
    const rows = rowsFor(s, d);
    if (!Array.isArray(rows) || !rows.length) continue;
    if (state.xMode === 'age' && !birthOf(s)) {
      missingAge.push(s);
      continue;
    }
    const name = `${s.givenname} ${s.familyname}`;
    const mk = (r) => ({ x: pointX(s, r), y: yT(r.sec), r, s });
    const win = rows.filter((r) => ageOK(s, r.date));
    if (!win.length) continue;
    if (showPR) {
      const full = prProgression(rows);
      const pr = full.filter((p) => ageOK(s, p.date)).map(mk);
      // PR die al stond bij het begin van de periode: laat de lijn op de beginleeftijd starten
      if (ui.ageFrom != null && birthOf(s)) {
        const before = full.filter((p) => !ageOK(s, p.date) && p.date < win[0].date).pop();
        if (before)
          pr.unshift({ x: ageBoundaryX(s, ui.ageFrom), y: yT(before.sec), r: before, s, ext: true });
      }
      // verleng de PR-lijn: tot het einde van de periode als er daarna nog gereden is, anders tot de laatste race
      const last = win[win.length - 1];
      if (pr.length) {
        const lp = pr[pr.length - 1];
        const later =
          ui.ageTo != null && birthOf(s) && rows.some((r) => r.date > last.date && !ageOK(s, r.date));
        if (later) pr.push({ x: ageBoundaryX(s, ui.ageTo + 1), y: lp.y, r: lp.r, s, ext: true });
        else if (last.date !== lp.r.date) pr.push({ x: pointX(s, last), y: lp.y, r: lp.r, s, ext: true });
      }
      datasets.push({
        label: name + ' – PR',
        data: pr,
        borderColor: s.color,
        backgroundColor: s.color,
        stepped:
          'before' /* Chart.js 'before': horizontaal op oude PR, verticaal op de datum van de nieuwe PR */,
        borderWidth: lw(s),
        pointRadius: pr.map((p) => (p.ext ? 0 : pr0(s) + (p.r.manual ? 1 : 0))),
        // zelf ingevoerde tijd: open stip
        pointBackgroundColor: pr.map((p) => (p.r.manual && !p.ext ? cssVar('--card') : s.color)),
        pointBorderWidth: pr.map((p) => (p.r.manual && !p.ext ? 2 : 1)),
        pointHoverRadius: 5,
        pointHitRadius: 6,
        showLine: true,
        order: s.hl ? 0 : 1,
        _lbl: name,
        _hl: !!s.hl,
        _sid: s.id, // schaatser-ID, voor klikken in de grafiek
      });
    }
    if (showAll) {
      datasets.push({
        label: name,
        data: win.map(mk),
        borderColor: s.color,
        backgroundColor: s.color + '55',
        pointBackgroundColor: win.map((r) => (r.manual ? cssVar('--card') : s.color + '55')),
        pointBorderWidth: win.map((r) => (r.manual ? 2 : 1)),
        showLine: false,
        pointRadius: win.map((r) => dot0(s) + (r.manual ? 1 : 0)),
        pointHoverRadius: 4,
        pointHitRadius: 5,
        order: s.hl ? 1 : 2,
        _lbl: showPR ? null : name,
        _hl: !!s.hl,
        _sid: s.id,
      });
    }
  }
  const allY = datasets.flatMap((ds) => ds.data.map((p) => p.y));
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'nearest', intersect: true },
    // klik op een lijn, stip of naam: highlight van die schaatser aan/uit
    onClick: (evt, _els, ch) => {
      const id = chartHitSkater(ch, evt.x, evt.y);
      if (id != null) toggleHighlight(id);
    },
    // handje als de muis boven iets klikbaars staat
    onHover: (evt, _els, ch) => {
      ch.canvas.style.cursor = chartHitSkater(ch, evt.x, evt.y) != null ? 'pointer' : '';
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: state.xMode === 'age' ? 'Leeftijd (jaren)' : 'Datum' },
        ticks: {
          maxRotation: 0,
          autoSkipPadding: 12,
          includeBounds: false,
          callback: (v) => (Number.isInteger(v) ? (state.xMode === 'age' ? v + ' j' : v) : ''),
        },
      },
      y: {
        type: 'linear',
        reverse: !fastTop, // sneller = grotere waarde, dus zonder omkeren staat de snelste al boven
        title: {
          display: true,
          text: `Tijd ${d} m${ui.ans ? ' (ANS)' : ''}`,
        },
        ticks: { includeBounds: false, callback: (v) => (v > 0 && isFinite(v) ? fmtTime(yInv(v)) : '') },
        afterBuildTicks: niceTimeTicks,
      },
    },
    plugins: {
      legend: { display: false }, // namen staan aan het eind van de lijnen (plugin endLabels)
      tooltip: {
        callbacks: {
          title: (items) => {
            const p = items[0].raw;
            return `${p.s.givenname} ${p.s.familyname}`;
          },
          label: (item) => {
            const p = item.raw,
              r = p.r,
              b = birthOf(p.s);
            const lines = [
              `${fmtTime(r.sec)}${r.raw != null ? ' ANS' : ''}  ${item.dataset.label.endsWith('– PR') ? '(PR)' : ''}`,
            ];
            if (r.raw != null)
              lines.push(
                `gereden ${fmtTime(r.raw)} · correctie ${r.ansPct > 0 ? '+' : ''}${r.ansPct.toFixed(2).replace('.', ',')}%`,
              );
            lines.push(`${fmtDateNL(r.date)} · ${r.location}`);
            if (b) lines.push('Leeftijd: ' + fmtAge(b.date, parseDate(r.date), b.est));
            lines.push(r.name);
            return lines;
          },
        },
      },
    },
  };
  if (allY.length) {
    const mn = Math.min(...allY),
      mx = Math.max(...allY),
      // bij (bijna) gelijke tijden een vaste marge, anders 6% van het bereik
      pad = mx - mn > mx * 1e-6 ? (mx - mn) * 0.06 : mx * 0.01;
    opts.scales.y.min = Math.max(0, mn - pad);
    opts.scales.y.max = mx + pad;
  } else {
    // lege grafiek (vanaf v84): vaste schaal, op 500 m van 60 tot 30 s, andere afstanden naar verhouding
    opts.scales.y.min = yT((60 * d) / 500);
    opts.scales.y.max = yT((30 * d) / 500);
  }
  const allX = datasets.flatMap((ds) => ds.data.map((p) => p.x)).filter((x) => x != null);
  if (allX.length) {
    opts.scales.x.min = Math.floor(Math.min(...allX));
    opts.scales.x.max = Math.ceil(Math.max(...allX));
  }
  if (state.xMode === 'age') {
    if (ui.ageFrom != null) opts.scales.x.min = ui.ageFrom;
    if (ui.ageTo != null) opts.scales.x.max = Math.max(ui.ageTo + 1, (opts.scales.x.min ?? 0) + 1);
  }
  // mobiel rechtop: alleen de namen van gehighlighte schaatsers aan de lijn (ruimte sparen)
  if (isMobilePortrait()) for (const ds of datasets) if (!ds._hl) ds._lbl = null;
  // ruimte rechts voor de namen
  const lblW = Math.max(0, ...datasets.filter((ds) => ds._lbl).map((ds) => labelWidth(ds._lbl, ds._hl)));
  opts.layout = { padding: { right: lblW ? lblW + 10 : 0 } };
  // kleuren van assen en rasterlijnen volgen het thema (licht/donker)
  if (Chart.defaults) {
    Chart.defaults.color = cssVar('--muted');
    Chart.defaults.borderColor = cssVar('--line');
  }
  if (chart) chart.destroy();
  chart = new Chart($('chart'), {
    type: 'scatter',
    data: { datasets },
    options: opts,
    plugins: [endLabels],
  });

  const loading = state.selected.some((s) => state.data[`${s.id}_${d}`] === 'loading');
  $('chartLoad').hidden = !loading;
  markEmptyDistances();
  const empty = state.selected.filter((s) => {
    const r = rowsFor(s, d);
    return genderOK(s) && Array.isArray(r) && !r.length;
  });
  const err = state.selected.filter((s) => state.data[`${s.id}_${d}`] === 'error');
  let msg = loading ? 'Laden…' : '';
  if (empty.length)
    msg +=
      (msg ? ' · ' : '') +
      `Geen ${d} m${ui.ans ? ' op NL-banen' : ''}${ui.maxT[d] ? ' sneller dan ' + fmtShort(ui.maxT[d]) : ''}: ${empty.map((s) => s.givenname).join(', ')}`;
  if (ui.ans && !ANS_EXACT.has(d))
    msg +=
      (msg ? ' · ' : '') +
      `ANS voor ${d} m afgeleid (${d === 700 ? 'gemiddelde 500/1000 m' : d === 10000 ? '5000 m-tabel' : '500 m-tabel'})`;
  if (err.length)
    msg +=
      (msg ? ' · ' : '') +
      `SpeedskatingResults reageert niet, geen tijden voor: ${err.map((s) => s.givenname).join(', ')}`;
  const stale = state.selected.filter((s) => state.stale[`${s.id}_${d}`] && !loading);
  if (stale.length) {
    const oldest = Math.min(...stale.map((s) => state.stale[`${s.id}_${d}`]));
    const when = new Date(oldest).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    msg +=
      (msg ? ' · ' : '') +
      `Server reageert niet, oudere tijden (van ${when}) voor: ${stale.map((s) => s.givenname).join(', ')}`;
  }
  if (missingAge.length)
    msg +=
      (msg ? ' · ' : '') +
      `Niet getoond (geen leeftijd bekend, vul geboortedatum in): ${missingAge.map((s) => s.givenname).join(', ')}`;
  $('loadStatus').textContent = msg;
  if ((err.length || stale.length) && !loading) {
    const b = document.createElement('button');
    b.className = 'retry';
    b.textContent = 'Opnieuw proberen';
    b.addEventListener('click', retryFailed);
    $('loadStatus').append(b);
  }

  renderAgeTable();
  renderPRTable();
}

/* ---------- Tabellen onder de grafiek ---------- */
/* Tabel "Beste tijd per leeftijdsjaar": per leeftijd de snelste tijd van elke schaatser */
/* Tabel "Beste tijd per leeftijdsjaar" (vanaf v59 gekanteld): een rij per schaatser, een kolom per
   leeftijd. Klik op een leeftijd om op die leeftijd te sorteren (snelste boven); nog een klik: terug. */
$('ageTable').addEventListener('click', (e) => {
  const th = e.target.closest('th[data-age]');
  if (!th) return;
  const a = +th.dataset.age;
  ui.ageSort = ui.ageSort === a ? null : a;
  save(LS_UI, ui);
  renderAgeTable();
});
function renderAgeTable() {
  const d = state.distance;
  let rowsSk = state.selected.filter((s) => {
    const r = rowsFor(s, d);
    return genderOK(s) && Array.isArray(r) && r.length && birthOf(s);
  });
  if (!rowsSk.length) {
    $('ageTable').innerHTML = '<div class="empty">Selecteer schaatsers met tijden op deze afstand.</div>';
    return;
  }
  // beste tijd per schaatser per leeftijd (in hele jaren)
  const per = new Map();
  const ages = new Set();
  for (const s of rowsSk) {
    const b = birthOf(s);
    const m = new Map();
    for (const r of rowsFor(s, d)) {
      if (!ageOK(s, r.date)) continue;
      const a = ageParts(b.date, parseDate(r.date)).y;
      ages.add(a);
      if (!m.has(a) || r.sec < m.get(a).sec) m.set(a, r);
    }
    per.set(s.id, m);
  }
  const cols = [...ages].sort((a, b) => a - b);
  rowsSk = rowsSk.filter((s) => per.get(s.id).size);
  // snelste per leeftijd (vet)
  const fastest = new Map(
    cols.map((a) => [a, Math.min(...rowsSk.map((s) => per.get(s.id).get(a)?.sec ?? Infinity))]),
  );
  const sortAge = cols.includes(ui.ageSort) ? ui.ageSort : null;
  if (sortAge != null)
    rowsSk = [...rowsSk].sort(
      (x, y) => (per.get(x.id).get(sortAge)?.sec ?? Infinity) - (per.get(y.id).get(sortAge)?.sec ?? Infinity),
    );
  let html =
    '<table><thead><tr><th>Schaatser</th>' +
    cols
      .map(
        (a) =>
          `<th class="num sortable" data-age="${a}" title="Klik: sorteren op ${a} jaar (snelste boven)">${a} jaar${a === sortAge ? ' ▲' : ''}</th>`,
      )
      .join('') +
    '</tr></thead><tbody>';
  for (const s of rowsSk) {
    const m = per.get(s.id);
    html +=
      `<tr><td><span class="dot" style="--c:${cleanColor(s.color) || '#888'}"></span>${esc(s.givenname)} ${esc(s.familyname)}${birthOf(s).est ? ' ≈' : ''}</td>` +
      cols
        .map((a) => {
          const v = m.get(a);
          return v
            ? `<td class="num ${rowsSk.length > 1 && v.sec === fastest.get(a) ? 'best' : ''}" title="${esc(fmtDateNL(v.date) + ' · ' + v.location + ' · ' + v.name + (v.raw != null ? ' · gereden ' + fmtTime(v.raw) : ''))}">${fmtTime(v.sec)}${v.manual ? ' ✎' : ''}</td>`
            : '<td class="num" style="color:var(--faint)">–</td>';
        })
        .join('') +
      '</tr>';
  }
  html +=
    '</tbody></table><div class="hint">Snelste tijd die gereden is in dat leeftijdsjaar. Vet = snelste van de vergeleken schaatsers op die leeftijd. Klik op een leeftijd om te sorteren. ≈ = leeftijd geschat. ✎ = zelf ingevoerd.' +
    (ui.ans ? ' Tijden zijn ANS-gecorrigeerd (alleen Nederlandse banen).' : '') +
    '</div>';
  $('ageTable').innerHTML = html;
}
/* Tabel "PR-verloop": elk PR met datum, leeftijd, verbetering, baan en wedstrijd */
/* Het PR-verloop staat altijd met het nieuwste PR bovenaan (vanaf v60; de sorteerknop is vervallen
   sinds je per schaatser kiest) */
/* Welke schaatser het PR-verloop toont: id, of 'all' voor alle schaatsers; null = nog niet gekozen
   (dan de eerste gehighlighte schaatser, anders de eerste in de selectie) */
let prWho = null;
$('prWho').addEventListener('change', (e) => {
  prWho = e.target.value === 'all' ? 'all' : +e.target.value;
  renderPRTable();
});
function renderPRTable() {
  const d = state.distance;
  const rows = [];
  // keuzelijst: alle zichtbare schaatsers; een gekozen schaatser die weg is valt terug op de standaard
  const vis = state.selected.filter(genderOK);
  let who = prWho;
  if (who !== 'all' && !vis.some((s) => s.id === who))
    who = (vis.find((s) => s.hl) || vis[0] || {}).id ?? 'all';
  $('prWho').innerHTML =
    vis
      .map(
        (s) =>
          `<option value="${Number(s.id)}" ${s.id === who ? 'selected' : ''}>${esc(s.givenname)} ${esc(s.familyname)}${s.hl ? ' ★' : ''}</option>`,
      )
      .join('') +
    (vis.length > 1
      ? `<option value="all" ${who === 'all' ? 'selected' : ''}>Alle schaatsers (${vis.length})</option>`
      : '');
  $('prWho').closest('label').hidden = !vis.length;
  for (const s of state.selected) {
    if (!genderOK(s)) continue;
    if (who !== 'all' && s.id !== who) continue;
    const data = rowsFor(s, d);
    if (!Array.isArray(data)) continue;
    const b = birthOf(s);
    for (const p of prProgression(data)) if (ageOK(s, p.date)) rows.push({ s, b, p });
  }
  if (!rows.length) {
    $('prTable').innerHTML = '<div class="empty">Nog geen PR-gegevens op deze afstand.</div>';
    return;
  }
  const byDate = (a, b) => (a.p.date < b.p.date ? -1 : a.p.date > b.p.date ? 1 : 0);
  rows.sort((a, b) => byDate(b, a));
  const dateHead = '<th>Datum</th>';
  $('prTable').innerHTML =
    '<table><thead><tr><th>Schaatser</th>' +
    dateHead +
    '<th>Leeftijd</th><th class="num">Tijd' +
    (ui.ans ? ' (ANS)' : '') +
    '</th>' +
    (ui.ans ? '<th class="num">Gereden</th>' : '') +
    '<th class="num">Verbetering</th><th>Baan</th><th>Wedstrijd</th></tr></thead><tbody>' +
    rows
      .map(
        ({
          s,
          b,
          p,
        }) => `<tr><td class="c-name"><span class="dot" style="--c:${cleanColor(s.color) || '#888'}"></span>${esc(s.givenname)} ${esc(s.familyname)}</td>
      <td class="c-date">${fmtDateNL(p.date)}</td><td class="c-age">${b ? fmtAge(b.date, parseDate(p.date), b.est) : ''}</td>
      <td class="num c-time"><b>${fmtTime(p.sec)}</b>${p.manual ? ' <span title="Zelf ingevoerd, nog niet op SpeedskatingResults">✎</span>' : ''}</td>${ui.ans ? `<td class="num c-raw">${fmtTime(p.raw)}</td>` : ''}
      <td class="num c-gain">${p.prev != null ? `<span class="gain">−${(p.prev - p.sec).toFixed(2).replace('.', ',')}</span>` : 'eerste'}</td>
      <td class="c-loc">${esc(p.location)}</td><td class="c-comp">${safeResultUrl(p.link) ? `<a href="${esc(safeResultUrl(p.link))}" target="_blank" rel="noopener">${esc(p.name)}</a>` : esc(p.name)}</td></tr>`,
      )
      .join('') +
    '</tbody></table>';
}

/* Maak tekst veilig voor gebruik in HTML (voorkomt dat namen als code worden gelezen) */
function esc(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

/* ---------- Thema: automatisch (volgt het systeem), licht of donker (vanaf v47) ---------- */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
// icoon en uitleg per thema (vanaf v59 een icoon in plaats van tekst)
const THEME_ICON = { auto: '◐', light: '☀', dark: '☾' };
const THEME_LABEL = { auto: 'automatisch', light: 'licht', dark: 'donker' };
function applyTheme() {
  if (ui.theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = ui.theme;
  $('themeBtn').textContent = THEME_ICON[ui.theme];
  $('themeBtn').title = `Thema: ${THEME_LABEL[ui.theme]} (klik om te wisselen)`;
  $('themeBtn').setAttribute('aria-label', $('themeBtn').title);
}
$('themeBtn').addEventListener('click', () => {
  ui.theme = ui.theme === 'auto' ? 'light' : ui.theme === 'light' ? 'dark' : 'auto';
  save(LS_UI, ui);
  applyTheme();
  render();
});
if (window.matchMedia)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (ui.theme === 'auto') render();
  });
applyTheme();

/* ---------- Mobiele weergave (vanaf v43) ----------
   Op een smal scherm (< 800 px) toont de pagina één tabblad tegelijk: Schaatsers, Grafiek,
   Tabellen of (vanaf v68) Mijn schaatsers (body data-mtab). De opmaak zit in de CSS; hier alleen de knoppen en de chips. */
const mq = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener() {} });
const MQ_MOBILE = mq('(max-width: 799px)');
const MQ_LANDSCAPE = mq(
  '(orientation: landscape) and (max-height: 500px) and (min-width: 600px) and (pointer: coarse)',
);
function isMobilePortrait() {
  return MQ_MOBILE.matches && !MQ_LANDSCAPE.matches;
}
function setMobileTab(tab) {
  document.body.dataset.mtab = tab;
  $('mineWrap').hidden = tab !== 'mine'; // beheer Mijn schaatsers als eigen tabblad (vanaf v68)
  document.querySelectorAll('.mtabs button').forEach((b) => b.classList.toggle('on', b.dataset.mtab === tab));
  window.scrollTo(0, 0);
  if (tab === 'chart') render(); // grafiek opnieuw tekenen nu hij zichtbaar is
}
function setMobileTable(tbl) {
  document.body.dataset.mtbl = tbl;
  document.querySelectorAll('#mTblSeg button').forEach((b) => {
    b.classList.toggle('on', b.dataset.tbl === tbl);
    b.setAttribute('aria-selected', b.dataset.tbl === tbl ? 'true' : 'false');
  });
}
function openFilters(open) {
  $('controls').classList.toggle('open', open);
  $('mBackdrop').classList.toggle('open', open);
}
/* Samenvatting van de filters, het aantal afwijkende filters en de chips onder de grafiek */
function renderMobileBits() {
  $('filterReset').hidden = !filtersOn();
  const parts = [`${state.distance} m`]; // gekozen afstand vooraan (vanaf v64)
  let n = 0;
  if (ui.ageFrom != null || ui.ageTo != null) {
    parts.push(`${ui.ageFrom ?? '…'}–${ui.ageTo ?? '…'} jaar`);
    n++;
  }
  if (ui.maxT && ui.maxT[state.distance]) {
    parts.push(`max. ${fmtTime(ui.maxT[state.distance])}`);
    n++;
  }
  // ANS staat vanaf v66 als knop in de afstandsbalk, dus niet meer in de samenvatting
  syncAns();
  if (!ui.showM || !ui.showF) {
    parts.push(!ui.showF ? 'alleen heren' : !ui.showM ? 'alleen dames' : '');
    n++;
  }
  if ($('showAll').checked) {
    parts.push('alle tijden');
    n++;
  }
  $('mSummary').textContent = parts.filter(Boolean).join(' · ');
  $('mFilterCount').textContent = n;
  $('mFilterCount').hidden = !n;
  $('mChips').innerHTML = state.selected
    .filter(genderOK)
    .map(
      (s) =>
        `<button type="button" data-id="${Number(s.id)}" class="${s.hl ? 'hl' : ''}" aria-pressed="${s.hl ? 'true' : 'false'}" style="--c:${cleanColor(s.color) || '#888'}"><span class="dot"></span>${esc(s.givenname)} ${esc(s.familyname)}${s.hl ? ' ★' : ''}</button>`,
    )
    .join('');
}
document
  .querySelectorAll('.mtabs button')
  .forEach((b) => b.addEventListener('click', () => setMobileTab(b.dataset.mtab)));
document
  .querySelectorAll('#mTblSeg button')
  .forEach((b) => b.addEventListener('click', () => setMobileTable(b.dataset.tbl)));
$('mFilterBtn').addEventListener('click', () => openFilters(true));
$('mFilterClose').addEventListener('click', () => openFilters(false));
$('mFilterDone').addEventListener('click', () => openFilters(false));
$('mBackdrop').addEventListener('click', () => openFilters(false));
$('mChips').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]');
  if (b) toggleHighlight(+b.dataset.id);
});
// wisselen tussen smal/breed of rechtop/liggend: namen aan de lijn opnieuw bepalen
MQ_MOBILE.addEventListener('change', () => {
  openFilters(false);
  render();
});
MQ_LANDSCAPE.addEventListener('change', () => render());
// startstand: grafiek (of Schaatsers als er nog niemand gekozen is); op mobiel PR's nieuwste eerst
setMobileTable('pr');
document.body.dataset.mtab = state.selected.length ? 'chart' : 'skaters';
document
  .querySelectorAll('.mtabs button')
  .forEach((b) => b.classList.toggle('on', b.dataset.mtab === document.body.dataset.mtab));

/* ---------- Start van de pagina ---------- */
/* Uitleg "Over deze tool" als venster (vanaf v59): knop ⓘ in de kopbalk; bij het eerste bezoek vanzelf open */
const LS_INTRO = 'ssr.intro.v1';
function openIntro(open) {
  $('introModal').hidden = !open;
  if (open) $('introClose').focus();
  else save(LS_INTRO, 1);
}
$('infoBtn').addEventListener('click', () => openIntro(true));
$('introClose').addEventListener('click', () => openIntro(false));
$('introModal').addEventListener('click', (e) => {
  if (e.target === $('introModal')) openIntro(false); // klik naast het venster
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('introModal').hidden) openIntro(false);
});
if (!load(LS_INTRO, 0)) openIntro(true);

/* ---------- Beheer van Mijn schaatsers openen en sluiten (vanaf v68) ----------
   Op mobiel het tabblad "Mijn schaatsers" in de balk onderin; op de pc een venster. */
function openMine() {
  if (MQ_MOBILE.matches) setMobileTab('mine');
  else {
    $('mineWrap').hidden = false;
    $('mineClose').focus();
  }
}
function closeMine() {
  if (!MQ_MOBILE.matches) $('mineWrap').hidden = true;
}
$('mineBtn').addEventListener('click', openMine);
$('mineClose').addEventListener('click', closeMine);
$('mineWrap').addEventListener('click', (e) => {
  if (e.target === $('mineWrap')) closeMine(); // klik naast het venster
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('mineWrap').hidden && e.target.id !== 'mineName') closeMine();
});
// wisselen tussen pc en mobiel: venster of tabblad op de juiste manier tonen
MQ_MOBILE.addEventListener('change', () => {
  if (MQ_MOBILE.matches) $('mineWrap').hidden = document.body.dataset.mtab !== 'mine';
  else if (document.body.dataset.mtab === 'mine') setMobileTab('skaters');
});

/* Tabjes in het blok "Toevoegen": Zoeken, Uit lijst of Bestand (keuze wordt onthouden) */
function showAddTab(tab) {
  document.querySelectorAll('#addTabs button').forEach((b) => {
    const on = b.dataset.pane === tab;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('aside .pane').forEach((p) => (p.hidden = p.dataset.pane !== tab));
}
$('addTabs').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-pane]');
  if (!b) return;
  ui.addTab = b.dataset.pane;
  save(LS_UI, ui);
  showAddTab(ui.addTab);
});
showAddTab(ui.addTab);
fillMaxT();
renderSelected();
// eerst de tijden voor de grafiek, daarna de nieuwe PR's van Mijn schaatsers (vanaf v86)
refresh().then(checkNewPRs);

/* ---------- Installeerbare app (PWA, vanaf v63) ----------
   De service worker (sw.js) bewaart de app en Chart.js, zodat de app ook offline opent. Alleen via
   http(s): bij een lokaal geopend bestand (file://) bestaat geen service worker en werkt alles zoals
   voorheen. De knop ⤓ verschijnt alleen als de browser installeren aanbiedt (Chrome, Edge, Android);
   op iPhone/iPad gaat het via Deel → "Zet op beginscherm". */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {}); // lukt het niet, dan gewoon zonder
  });
}
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // geen eigen balk van de browser; wij tonen de knop ⤓
  installPrompt = e;
  $('installBtn').hidden = false;
});
$('installBtn').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $('installBtn').hidden = true;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  $('installBtn').hidden = true;
  showToast('Schaatsvergelijker is als app geïnstalleerd.');
});
