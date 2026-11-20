# Architectuur

## Uitgangspunten

- **Statische bestanden zonder build-stap of backend.** Tot en met v82 stond alles in één HTML-bestand; vanaf v83 is dat gesplitst in vier bestanden die naast elkaar staan (zie hieronder). Er is nog steeds geen build-stap: de browser laadt de bestanden zoals ze zijn, en dubbelklikken op `index.html` werkt nog.
- **Gewone scripts, geen modules:** `data.js` en `app.js` zijn gewone `<script src>`-bestanden. Constanten op het bovenste niveau van `data.js` zijn daardoor ook in `app.js` beschikbaar. ES-modules zouden bij openen vanaf de pc (`file://`) door de browser worden geblokkeerd.
- **Data live uit de browser:** de API staat CORS toe (`*`), dus geen proxy nodig.
- **Externe afhankelijkheid:** alleen Chart.js 4.4.1 via `cdnjs.cloudflare.com`.
- **Opslag:** alleen `localStorage` van de gebruiker; niets gaat naar een server.
- **Installeerbaar (PWA, vanaf v63):** naast de HTML staan `manifest.webmanifest`, `sw.js` en `icons/`. Dat zijn de enige extra bestanden; de app blijft zonder build-stap.
- **Geen persoonsgegevens in de pagina:** namen, groepen en geboortedata komen uit JSON-bestanden die de gebruiker zelf opent (zie `GROEPEN.md`). Enige uitzondering: de ingebouwde lijst met publiek bekende topschaatsers (`TOP_SKATERS`).

> Een gepubliceerde claude.ai-artifact kan deze app **niet** draaien: daar blokkeert de content security policy `fetch` naar andere domeinen. Lokaal openen of zelf hosten werkt wel.

## Bestanden (vanaf v83)

| Bestand | Inhoud |
|---|---|
| `index.html` | Schermindeling: kopbalk, Toevoegen, Geselecteerd, afstandsbalk, filters, grafiek, tabellen, vensters en de tabbalk voor mobiel. Laadt Chart.js en `app.css` in `<head>` en onderaan `data.js` en daarna `app.js` |
| `app.css` | Alle opmaak, inclusief donkere modus, mobiele weergave en de liggende telefoon |
| `data.js` | Vaste gegevens zonder werking: `ANS` en `ANS_BASE` (KNSB-tabellen), `RINK_SHORT` (afkortingen van de banen) en `TOP_GROUP`/`TOP_SKATERS` (publiek bekende topschaatsers). Moet vóór `app.js` geladen worden |
| `app.js` | Alle werking: instellingen, invoercontrole, opslag, API, schermonderdelen, grafiek en tabellen (zie de tabel hieronder) |

De splitsing in v83 is mechanisch: de code is niet gewijzigd. Dat is gecontroleerd door de syntaxboom (AST) van `app.js` en `data.js` te vergelijken met het script uit v82, en door v82 en v83 in headless Chrome naast elkaar te testen (zelfde grafiek, tabellen, ANS, Uit lijst, mobiel en offline).

## Datastroom

```
Zoeken ──► xml/skater_lookup.php ──► resultatenlijst ──► + Toevoegen ──► state.selected (localStorage)
                                                                        │
Afstand kiezen ──► per geselecteerde schaatser: json/skater_results.php?skater&distance
                   (max. 4 gelijktijdig, cache 6 uur in localStorage)
                                                                        │
                       sorteren op datum ──► prProgression() ──► grafiek + tabellen
```

## Belangrijkste onderdelen in de code

| Functie / object | Rol |
|---|---|
| `state` | `selected` (schaatsers), `distance`, `xMode` (vast `'age'`; de datumweergave is in v12 verwijderd, de code-paden voor `'date'` zijn nog aanwezig maar onbereikbaar), `data` (cache per `id_afstand`), `stale` (per `id_afstand` het tijdstip van oude cache die gebruikt wordt omdat de server niet reageerde, vanaf v38) |
| `TOP_GROUP` / `TOP_SKATERS` / `topList` | Ingebouwde lijst van 25 topschaatsers in één groep "Topschaatsers" (vanaf v80), onderaan in "Uit lijst" (`*` = alle, `s:id` = één) |
| `state.mine` / `renderMine()` / `keepInMine()` / `importMine()` | Blok "Mijn schaatsers" (vanaf v67): eigen schaatsers in groepen (`state.mineView` = gekozen groep: `*`, `g:naam` of `-`). `renderSelected()` roept `renderMine()` aan, en die `fillListSel()` (keuzelijst Uit lijst: `m*`/`mg:`/`ms:` eigen, `*`/`g:`/`s:` top; `chosenListSkaters()`); `persistSel()` neemt een ingevulde geboortedatum over (`syncMineBirth()`). Export/import: `MINE_FORMAT`, zie GROEPEN.md |
| `addSkaterList()` | Voegt een lijst schaatsers toe (gedeeld door "Mijn schaatsers", "Topschaatsers" en "Schaatsersbestand"); bestaande krijgen geboortedatum (en bij Uit lijst de groep) bijgewerkt |
| `parseSkaterFile()` / `loadSkaterFile()` | Leest een schaatsersbestand (JSON, formaat `schaatsvergelijker/1`) via `FileReader`; alleen in het geheugen. Vanaf v70 zonder groepen: één bestand tegelijk in `fileSkaters`, knop `#fileAdd` voegt alles toe. Groepsvelden tellen alleen bij Importeren in Mijn schaatsers (`opt.keepGroups`) |
| `saveSel` (knop) | Exporteert `state.selected` als JSON-download (Blob + `<a download>`), zonder groep (vanaf v47) |
| `addSkater()` | Voegt een schaatser toe met een vrije kleur (20 kleuren), eventueel met `birth` en `group` |
| `searchSkaters()` | Lookup via de XML-API (max. 20), parse met `DOMParser` |
| `getResults()` | Haalt alle tijden op één afstand op; filtert onleesbare tijden; sorteert op datum; cachet |
| `renderSoon()` / `retryFailed()` | Tijdens het laden de grafiek max. 1×/s bijwerken; schaatsers met fout of oude cache opnieuw ophalen (knop "Opnieuw proberen", vanaf v38) |
| `limited()` / `pump()` | Wachtrij die maximaal 4 requests tegelijk uitvoert |
| `parseTime()` / `fmtTime()` | `m.ss,hh` ↔ seconden |
| `estimateBirth()` / `birthOf()` | Geboortedatum uit invoer of uit categorie (zie `LEEFTIJD.md`) |
| `ageParts()` / `ageDecimal()` / `fmtAge()` | Leeftijd in jaren + maanden of als decimaal getal |
| `prProgression()` | Loopt chronologisch door de races en houdt elk nieuw PR bij (met vorige PR) |
| `render()` | Bouwt de Chart.js-datasets: PR-lijn (`stepped:'before'`) en alle races (scatter) |
| `renderAgeTable()` | Beste tijd per leeftijdsjaar: vanaf v59 een rij per schaatser en een kolom per leeftijd; klik op een kolomkop (`th[data-age]`) sorteert op die leeftijd (`ui.ageSort`) |
| `renderPRTable()` | PR-verloop met verbetering en wedstrijdlink; altijd nieuwste PR bovenaan (vanaf v60; `prSort` is vervallen); keuzelijst `#prWho` (`prWho`: schaatser-ID of `'all'`; standaard eerste gehighlighte, anders eerste schaatser; vanaf v48) |
| `ANS` / `ansPct()` | KNSB ANS-percentages per baan en afstand; `ansPct(locatie, afstand)` geeft het percentage of `null` (niet-NL of onbekende baan) |
| `rowsFor()` | Tijden van een schaatser zoals getoond: bij ANS gefilterd op NL-banen en omgerekend (`sec`), met de originele tijd in `raw`; daarna gefilterd op de maximale tijd (`ui.maxT[afstand]`) |
| `fillMaxT()` / `maxTStep()` | Vult de keuzelijst Max. tijd voor de gekozen afstand: 3 t/m 20 stappen van `10 × afstand / 500` seconden |
| `ageOK()` | Valt een race binnen de gekozen leeftijdsperiode (`ui.ageFrom`/`ui.ageTo`)? Zonder bekende leeftijd: altijd ja |
| `genderOK()` | Valt een schaatser binnen het filter heren/dames? Onbekend geslacht: altijd ja |
| `ageBoundaryX()` | x-positie waarop een schaatser de beginleeftijd bereikt (voor het startpunt van de PR-lijn) |
| `renderSelected()` | Kaartjes per schaatser: kop met naam, profiel-↗, ster en ×; regel met `catLabel()` (bijv. "Heren Pupillen C"; vanaf v54) en groepslabels; daaronder een raster `.rows` (label + waarde) met Geboren, eventueel de schatting, en de eigen tijden (`ownTimesHtml()` geeft `{rows, add}`; vanaf v52). Een ingevulde datum staat als klikbare tekst met huidige leeftijd (`data-act=bedit`) tot je hem wijzigt (set `editBirth`, knop Klaar = `bdone`; vanaf v49) |
| `birthSelects()` / `resolveBirthPick()` | Keuzelijsten voor maand en jaar (jaren passend bij de categorie) en de regel "laatste keuze wint"; gedeeld door Geselecteerd en de zoekresultaten (vanaf v46) |
| `renderResults()` / `resBirth` | Zoekresultaten met keuze voor de geboortedatum vóór het toevoegen; de keuze staat alleen in het geheugen (`resBirth[id]`) en gaat bij toevoegen mee als `birth` of `draftY`/`draftM` (vanaf v46) |

## Invoercontrole (vanaf v30)

Alles wat van buiten komt, gaat door een controlefunctie; de rest van de code vertrouwt daarna op het formaat.

| Bron | Functie | Wat er gebeurt |
|---|---|---|
| Selectie in localStorage | `cleanSelection()` / `cleanSkater()` | Nieuw object per schaatser; ID positief geheel getal, kleur uit `COLORS`, tekstlengtes begrensd, geen dubbele, max. `MAX_SKATERS` (100) |
| Instellingen in localStorage | `cleanUi()` | Alleen bekende sleutels met geldige waarden; oude sleutels (zoals `scale`, `log`) vallen weg |
| Cache met tijden | `cleanResult()` in `getResults()` | Elke rij gecontroleerd; klopt er iets niet, dan wordt opnieuw opgehaald |
| API (zoeken en tijden) | `fetchText()`, `cleanResult()`, `cleanId()` | Time-out 15 s (`FETCH_TIMEOUT_MS`, vanaf v78 via `Promise.race` zonder `AbortSignal`), max. 5 MB per antwoord, velden gecontroleerd |
| Wedstrijdlinks | `safeResultUrl()` | Alleen `https://(www.)speedskatingresults.com`; anders geen link |
| Zelf ingevoerde tijden | `cleanManual()` | Afstand uit `DISTANCES`, tijd via `parseTime()`, datum `JJJJ-MM-DD`, baan uit `NL_RINKS` of leeg; max. 500 |
| Schaatsersbestand | `parseSkaterFile()` | Max. 1 MB (`MAX_FILE_BYTES`) en 100 schaatsers; ongeldige/dubbele ID's overgeslagen |

Bij het tonen gebruiken de profiellinks `Number(s.id)` en de kleuren `cleanColor()`, als extra laag. Alle overige tekst in HTML gaat door `esc()`.

## Opslag (localStorage)

| Sleutel | Inhoud |
|---|---|
| `ssr.selected.v1` | Array met geselecteerde schaatsers: `id`, namen, `country`, `gender`, `category`, `color`, `birth` (`YYYY-MM-15` of `null`), `draftY`/`draftM` (half ingevuld), `catSeason` (seizoen waarin `category` gold), `group` |
| `ssr.ui.v1` | `{ageFrom, ageTo, showM, showF, ans, maxT, theme, rink, addTab, ageSort}` (`maxT` = `{afstand: seconden}`): leeftijdsperiode (`null` = geen grens), filter heren/dames en ANS-vinkje |
| `ssr.mine.v1` | "Mijn schaatsers" (vanaf v67): `{groups: [naam], skaters: [{id, givenname, familyname, gender, country, category, catSeason, birth, groups: [naam]}]}`; gecontroleerd met `cleanMine()` (max. `MAX_MINE` 500 schaatsers, `MAX_GROUPS` 30 groepen van max. 60 tekens) |
| `ssr.manual.v1` | Zelf ingevoerde tijden (vanaf v51): `[{mid, id, dist, time, date, loc}]`; `loc` = NL-baan of leeg (buitenland/anders). Niet in de JSON-export |
| `ssr.intro.v1` | `1` zodra het venster "Over deze tool" een keer is gesloten (vanaf v59); daarna gaat het niet meer vanzelf open |
| `ssr.cache.v1.<id>_<afstand>` | `{t: timestamp, r: [resultaten]}`; 6 uur geldig; daarna alleen nog als noodoplossing als de server niet reageert (vanaf v38) |
| ~~`ssr.cache.v1.pr_<id>`~~ | PR-lijst uit `personal_records` (v65–v77). Vervallen in v78; bij het laden van de pagina worden achtergebleven sleutels verwijderd |

Wordt het formaat gewijzigd, verhoog dan het versienummer in de sleutel.

## Grafiekdetails

- Bij de PR-lijn betekent Chart.js `stepped:'before'` dat de lijn horizontaal blijft op het oude PR en verticaal springt op de datum van het nieuwe PR. (`'after'` doet het andersom en is fout.)
- De PR-lijn wordt horizontaal doorgetrokken tot de laatst gereden race binnen de periode. Heeft de schaatser ná de eindleeftijd nog tijden, dan loopt de lijn door tot het einde van de periode (eindleeftijd + 1), net zoals hij links op de beginleeftijd start.
- Met een beginleeftijd start de PR-lijn op die leeftijd met het PR dat er toen al stond (onzichtbaar punt), zodat de eerste verbetering binnen de periode correct als stap zichtbaar is.
- PR's worden altijd over de **hele** carrière bepaald; de periode filtert alleen wat getoond wordt.
- De y-as staat standaard omgekeerd, met de snelste tijd boven (knop "Snelste boven").
- De x-as is lineair: decimale leeftijd.
- Namen aan de lijn: Chart.js-plugin `endLabels` (`afterDatasetsDraw`) tekent bij elke dataset met `_lbl` de naam rechts van het punt met de grootste leeftijd. Labels (10 px, vanaf v42) die elkaar raken worden `LBL_STEP` (11 px) uit elkaar geschoven; `layout.padding.right` krijgt de breedte van het langste label (`labelWidth()`). De legenda staat uit.
- Klikken in de grafiek (vanaf v40): `onClick` → `chartHitSkater()` zoekt de schaatser onder de muis (eerst de naamvakjes die `endLabels` in `ch._lblBoxes` bewaart, dan stippen via Chart.js, dan PR-lijnstukken binnen 5 px; bij `stepped:'before'` horizontaal op de oude y en verticaal bij de nieuwe x) → `toggleHighlight()`. Elke dataset heeft `_sid` (schaatser-ID). `onHover` toont een handje. Chart.js roept `onClick`/`onHover` alleen aan binnen het grafiekvlak; voor namen in de rechtermarge vangt `endLabels.afterEvent` klik en hover zelf af (vanaf v42).
- Highlight (`s.hl` per schaatser, opgeslagen in `ssr.selected.v1`): lijndikte 3 px en stippen 3,5 px, `order` 0 zodat de lijn bovenop ligt. Is er minstens één (zichtbare) schaatser gemarkeerd, dan krijgen de anderen 1 px en kleinere stippen; anders de standaard 1,5 px.
- Snelheidsschaal (vast sinds v31; in v26–v30 een keuzelijst met ook tijd en log): de geplotte waarde is `yT(t) = 1/t` (evenredig met km/u) op een lineaire as. `reverse` is `!fastTop`, omdat sneller een grotere waarde is. `niceTimeTicks()` zet ronde tijdstappen op de as en de labels tonen `fmtTime(yInv(v))`. Tooltips en tabellen gebruiken altijd de echte tijd (`r.sec`).

## Zelf ingevoerde tijden (vanaf v51)

- Voor een zojuist gereden tijd die nog niet op SpeedskatingResults staat. Knop **+ tijd** op het kaartje opent een invoerregel (afstand, tijd, datum, baan); de open regels staan in `timeForm` (geheugen), zodat getypte tekst een nieuwe opbouw van het kaartje overleeft.
- `normTimeInput()` accepteert `46,10`, `46.10`, `46`, `1.23,45` en `1:23,45`. Controle: tijd tussen `afstand/18` en `afstand` seconden, datum niet in de toekomst, baan verplicht (`NL_RINKS` = alle banen uit de ANS-tabel, of "buitenland/anders"). De laatst gekozen baan staat in `ui.rink`.
- `rowsFor()` voegt de eigen tijden via `manualRows()` toe aan de API-rijen, vóór ANS-correctie en max.-tijdfilter; baan wordt `"<baan> (NED)"`, zodat `ansPct()` gewoon werkt. Buitenland/anders valt weg met ANS aan.
- Kaartje: rij **Toegevoegd**, baan afgekort via `RINK_SHORT` met de drieletterafkortingen uit de KNSB-ranglijsten op schaatsen.nl (vanaf v55).
- Grafiek: open stip (`pointBackgroundColor` = `--card`, rand 2 px, 1 px groter). Tabellen: ✎ achter de tijd; tooltip en wedstrijdkolom tonen "Zelf ingevoerd (nog niet op SpeedskatingResults)".
- Opruimen: een eigen tijd wordt verborgen zodra de API-rijen dezelfde datum en tijd (verschil < 0,015 s) bevatten, en `pruneManual()` verwijdert hem na elke `refresh()` uit de opslag.

## Filters en weergave-opties (vanaf v56)

- Boven de grafiek in `#controls`: filtergroepjes `.fgrp` (leeftijd, max. tijd), `#genderSeg` (Heren/Dames/Beide → `ui.showM`/`ui.showF`; beide uit wordt bij het laden hersteld naar beide aan) en `#filterReset` (zichtbaar als `filtersOn()`; wist `ageFrom`/`ageTo`, alle `maxT` en het geslachtsfilter).
- Onder de grafiek in `#viewOpts` (vanaf v77 een segmentbalk, links, op pc en mobiel gelijk): PR-lijn, Alle tijden en Snelste boven. Elke knop is een `label.sw` met een onzichtbare checkbox (`showPR`, `showAll`, `fastTop`) en een vinkje `.chk`; `label.sw:has(input:checked)` maakt de knop blauw en toont het vinkje (het vinkje houdt altijd zijn plek, zodat de breedte niet verandert). Op de pc 14 px en 34 px hoog, op mobiel 12 px en 36 px (gelijk aan de afstandsbalk). PR-lijn en Alle tijden kunnen niet allebei uit: zet je de laatste uit, dan gaat de andere aan. Tot v75 waren het op de pc schakelaartjes onder het einde van de x-as (plugin `alignViewOpts`, vervallen in v76). (De ANS-schakelaar `ansOn` stond hier van v57 tot v71.)
- Opmaak van keuzeknoppen (vanaf v77): afstandsbalk, Heren/Dames/Beide (`.gseg`, ook de tabjes bij Toevoegen) en de weergave-opties zijn allemaal segmentbalken met een grijze rand; gekozen of aan = `--accent` met witte tekst, niet vet. Aan/uit-knoppen (ANS en de weergave-opties) tonen daarbij ✓.
- Afstandsbalk `#distTabs` (vanaf v72): op de pc (vanaf v73) een `inline-flex`-balk met alle negen afstanden als knoppen van vaste breedte (76 px) en `#ansBtn`; op mobiel over de hele breedte met knoppen 100 t/m 1500 m (de lange afstanden hebben klasse `.dlong` en zijn daar verborgen), de uitklapknop `#distMoreBtn` in `.dmore` met het menu `#distMenu` (3000, 5000, 10000 m; `LONG_DISTANCES`, `openDistMenu()`, sluit bij klik ernaast of Esc) en als laatste vakje `#ansBtn` (`.ansseg`, dikkere scheidingslijn; zet `ui.ans` om, `syncAns()` zet klasse `on` en `aria-pressed`). `syncDistTabs()` maakt de gekozen afstand blauw; bij een lange afstand is ook de uitklapknop blauw met de afstand als label ("5000 m", mobiel "5k"), anders "3k+". Op mobiel zijn alle afstandsvakjes `flex: 1 1 0` met `padding: 0`, ANS heeft een vaste inhoud (het vinkje `.chk` is altijd aanwezig, alleen onzichtbaar als ANS uit staat), zodat de breedtes niet veranderen. `markEmptyDistances()` maakt ook de uitklapknop grijs als alle drie de lange afstanden geen tijden hebben.
- Mobiel: `#controls` blijft het filterpaneel (ook `.gseg` en `.freset` alleen in het open paneel); `#viewOpts` staat onder de grafiek en is verborgen in het tabblad Tabellen en liggend.

## Indeling en hulpelementen (vanaf v59)

- Kopbalk: korte bronvermelding, knoppen `#infoBtn` (ⓘ) en `#themeBtn` (icoon ◐/☀/☾, `THEME_ICON`) in `.hbtns`.
- `#introModal`: venster met de uitleg; `openIntro()`; sluit met ×, Esc of klik naast het venster.
- Linkerkolom: blok **Toevoegen** met tabjes `#addTabs` (`showAddTab()`, `ui.addTab`) en panelen `.pane` (zoeken, `#listCard` = Uit lijst, `#fileCard`); het beheer van Mijn schaatsers staat los in `#mineWrap`/`#mineCard` (pc: venster via `#mineBtn`; mobiel: tabblad `data-mtab="mine"`; `openMine()`/`closeMine()`, vanaf v68); daaronder **Geselecteerd**.
- `showToast(tekst, knoptekst, actie)` / `hideToast()`: melding onderin (8 s). "Alles wissen" toont "Ongedaan maken" (`setSelection()`).
- `markEmptyDistances()` (in `render()`): afstandstabblad krijgt klasse `nodata` als voor alle zichtbare schaatsers al bekend is dat er geen tijden zijn. Alleen opgehaalde afstanden tellen mee (`rowsFor()`, dus met ANS, max. tijd en zelf ingevoerde tijden); nog niet opgehaalde afstanden blijven gewoon. In v65–v77 haalde `loadPrDistances()` daarvoor per schaatser `personal_records` op; dat is in v78 vervallen om de belasting van SpeedskatingResults te verlagen: `refresh()` haalt alleen de open afstand op, andere afstanden pas na een klik op het tabblad.
- `#chartLoad`: draaiend icoon met "Tijden ophalen…" boven de grafiek zolang er nog tijden worden opgehaald.

## Thema: licht en donker (vanaf v47)

- Alle kleuren staan in CSS-variabelen op `:root` (o.a. `--bg`, `--card`, `--ink`, `--muted`, `--line`, `--accent`, `--warn-bg`, `--ok`, `--ok-bg`, `--seg`, `--faint`, `--link`). De donkere waarden gelden bij `:root[data-theme='dark']`, of via `prefers-color-scheme: dark` zolang er geen vaste keuze is.
- Knop `#themeBtn` wisselt `ui.theme` (`auto` → `light` → `dark`), opgeslagen in `ssr.ui.v1`; `applyTheme()` zet `data-theme` op `<html>`.
- Grafiek: `render()` zet `Chart.defaults.color` en `Chart.defaults.borderColor` uit `--muted` en `--line`; de halo van de namen gebruikt `--card` (`cssVar()`).

## Mobiele weergave (vanaf v43)

- Eén bestand, twee weergaven. Onder 800 px breed (`MQ_MOBILE`) zet CSS de pagina om naar tabbladen; daarboven geldt de desktopopmaak ongewijzigd. Mobiele elementen (`.mobile-only`, `.mtabs`, `.sheethead`, `.sheetdone`, `#mBackdrop`) zijn op desktop `display: none`.
- Tabblad: `body[data-mtab]` = `skaters` | `chart` | `tables` (`setMobileTab()`); tabel: `body[data-mtbl]` = `pr` | `age` (`setMobileTable()`). Start op `chart`, of `skaters` bij een lege selectie. Niet opgeslagen.
- Filters: dezelfde `.controls` (`#controls`) wordt op mobiel een paneel van onderen met klasse `open` (`openFilters()`); daarbuiten blijft alleen de statusregel zichtbaar. `renderMobileBits()` (aan het begin van `render()`) vult de samenvatting `#mSummary`, het aantal `#mFilterCount` en de chips `#mChips` (tik = `toggleHighlight()`).
- Kop van de grafiek (vanaf v64): de afstanden staan als één segmentbalk op een regel (`.tabs`, vanaf v72 ook op de pc, zie Filters en weergave-opties). Elke knop heeft een lang label (`.dl`, "100 m", desktop) en een kort label (`.ds`, "100", mobiel). `#mSummary` begint met de gekozen afstand. De knop Filters is 42 px hoog met een icoon. De weergave-opties (`.viewopts`) zijn knoppen, links uitgelijnd (vanaf v76; zie Filters en weergave-opties).
- Namen aan de lijn: bij `isMobilePortrait()` wist `render()` `_lbl` van niet-gehighlighte datasets.
- PR-verloop: de cellen hebben klassen `c-name`, `c-date`, `c-age`, `c-time`, `c-raw`, `c-gain`, `c-loc`, `c-comp`; mobiele CSS maakt er kaartjes van.
- Telefoon liggend (`MQ_LANDSCAPE`: landscape, hoogte ≤ 500 px, breedte ≥ 600 px, touchscherm; de breedte-eis sinds v45 zodat een geopend toetsenbord niet meetelt): alleen de grafiek op schermhoogte (`100dvh`), met alle namen; geen kopbalk, filters of filterknop (vanaf v61) en geen afstandstabbladen (vanaf v62).
- Bij wisselen van breedte of stand roept een `matchMedia`-listener `render()` opnieuw aan.

## Installeerbare app (PWA, vanaf v63)

| Bestand | Rol |
|---|---|
| `manifest.webmanifest` | Naam, iconen, `display: standalone`, kleuren (`theme_color` = kopbalk `#14213d`). Bewust `.webmanifest` en geen `.json`: `.gitignore` sluit alle `.json`-bestanden uit |
| `sw.js` | Service worker. Cache `schaatsvergelijker-vNN` met `./`, `index.html`, `app.css`, `data.js`, `app.js`, manifest en iconen; Chart.js los (een haperende CDN blokkeert de installatie niet; anders komt hij bij eerste gebruik in de cache). Pagina en eigen CSS/scripts (vanaf v83): **netwerk eerst**, offline uit de cache, zodat pagina en code altijd van dezelfde versie zijn. Iconen, manifest en Chart.js: cache eerst. De API van SpeedskatingResults gaat er ongemoeid doorheen (de app cachet tijden zelf in `localStorage`). `skipWaiting` + `clients.claim`; oude caches worden bij activeren gewist |
| `icons/` | `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (volle achtergrond, veilige zone), `apple-touch-icon.png` (180 px), `favicon-32.png` |

- In `<head>`: `link rel=manifest` (vanaf v69 met `crossorigin="use-credentials"`, nodig achter Cloudflare Access: zonder cookie geeft Access het inlogscherm in plaats van het manifest), `theme-color`, favicon, `apple-touch-icon` en de `apple-mobile-web-app-*`-metatags.
- Registratie onderaan het script, alleen bij `http(s)` (bij `file://` bestaat geen service worker).
- Knop `#installBtn` (⤓) in `.hbtns`: verborgen tot `beforeinstallprompt` (Chrome/Edge/Android); klik roept `prompt()` aan. Na `appinstalled` verdwijnt hij en volgt een melding. iOS kent dit event niet; de uitleg in "Over deze tool" noemt Deel → "Zet op beginscherm".
- **Bij elke nieuwe versie:** verhoog ook `CACHE` in `sw.js` naar het nieuwe versienummer, zodat de oude cache wordt opgeruimd.

## Testen

Getest in de ingebouwde browser van de Claude-app. De app is daarvoor tijdelijk geladen op het domein van speedskatingresults.com (via `document.write`), omdat lokale bestanden daar niet geopend kunnen worden. Daarna zijn de `ssr.*`-sleutels in `localStorage` opgeruimd.

De PWA (v63) is getest met headless Chrome (Playwright) op een lokale webserver: service worker actief, cache gevuld, manifest zonder fouten en de pagina opent offline.
