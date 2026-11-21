# Backlog: beperkingen en ideeën

## Bekende beperkingen

- **Geboortedatum handmatig:** de API geeft die niet en de profielpagina is niet cross-origin leesbaar. Daarom schat de app uit de categorie of vult de gebruiker hem in.
- **Uitschieters:** vallen en vergelijkbare races staan gewoon in de data (bv. 1.15 op de 500 m) en vertekenen de y-as.
- **Geen onderscheid baantype:** binnen- en buitenbanen en hooglandbanen (Calgary, Salt Lake City) worden niet apart gemarkeerd.
- **Eén afstand tegelijk:** er is geen overzicht over alle afstanden heen.
- **Zoeken:** max. 20 resultaten; zoeken werkt alleen op het begin van de naam.
- **Geen export** van grafiek of tabellen.
- **Datakwaliteit:** wat niet in SpeedskatingResults staat (bv. clubwedstrijden die niet zijn ingevoerd), ontbreekt ook hier.

## Ideeën

- [ ] **Tussenbreedte 800–1200 px** (gevonden 21-11-2026, voorstel; nog niet besloten). Onderzoek v88: (1) 800–900 px: desktopweergave in één kolom, grafiek onder de kaartjes; restant van de regel `@media (max-width: 900px)` van vóór de mobiele weergave (v43). (2) 900–± 1170 px: twee kolommen, maar de afstandsbalk (vast 9 × 76 px + ANS ≈ 757 px) is breder dan de grafiekkolom en steekt uit de kaart; de pagina scrolt dan horizontaal (gemeten: 920, 1000 en 1100 px). Op 1000 px lopen ook de filters over twee regels.
  Voorstel: de 900-px-regel schrappen (altijd twee kolommen vanaf 800 px) en onder 1200 px de afstandsbalk van mobiel gebruiken: vakjes die meekrimpen, korte labels (100, 500, …) en de lange afstanden in 3k+. Eventueel linkerkolom 300 px tussen 800 en 1000 px.
- [x] **Lettergrootte mobiel: vaste schaal en instelbaar** (idee en besluit 21-11-2026). Gedaan in v87: vijf maten als CSS-variabelen (mobiel 12/14/16/18/20 px), kopjes en tabellen niet meer kleiner dan de tekst, invoer 16 px (geen inzoomen op iOS), knop **Aa** voor normaal/groot/extra groot, grafiek schaalt mee, krappe plekken met bovengrens. Zie `ARCHITECTUUR.md`.
- [x] **Tijdencache opruimen** (besloten 20-11-2026). Gedaan in v85: `pruneCache()` verwijdert bij het starten de sleutels `ssr.cache.v1.<id>_<afstand>` van schaatsers die niet in de selectie, Mijn schaatsers of `TOP_SKATERS` staan. Andere `ssr.*`-sleutels blijven ongemoeid.
- [x] **Nieuwe PR's sinds je vorige bezoek (Mijn schaatsers)** (idee en besluit 20-11-2026). Gedaan in v86: automatisch bij het openen, `personal_records` plus `skater_results` voor 100 en 300 m, geziene PR's in `ssr.seen.v1`, badge en lijst in Mijn schaatsers, gezien pas na × of Alles gezien. Zie `ARCHITECTUUR.md`.
- [ ] Uitschieters filteren (bv. tijden > X % boven de PR van dat moment verbergen).
- [ ] Baan markeren in tooltip/kleur; filter op "alleen laaglandbanen".
- [ ] Overzichtsmatrix: PR per afstand per schaatser, met leeftijd bij het PR.
- [ ] Vergelijking "verschil t.o.v. referentieschaatser op dezelfde leeftijd" (in seconden of %).
- [x] Geboortedata exporteren/importeren (JSON), zodat ze op een andere pc of browser bruikbaar zijn. Gedaan in v67: Exporteren/Importeren in Mijn schaatsers neemt de geboortedata mee (zie `GROEPEN.md`).
- [ ] Deelbare URL met geselecteerde schaatser-ID's en afstand.
- [ ] Grafiek als PNG en tabellen als CSV downloaden.
- [ ] Seizoensbesten (`season_bests`) als alternatieve weergave.
- [ ] Puntentotaal (samalog) voor allroundcombinaties.
- [ ] Git-repository in de projectmap zodra er schijfruimte is (zie `CLAUDE.md`).
