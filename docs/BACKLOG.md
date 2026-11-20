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
