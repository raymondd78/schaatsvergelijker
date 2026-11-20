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
- [ ] **Nieuwe PR's sinds je vorige bezoek (Mijn schaatsers)** (idee 20-11-2026). Een coach opent de app na een wedstrijdweekend en ziet meteen welke van zijn eigen schaatsers een nieuw PR hebben gereden.
  - **Ophalen:** per schaatser in Mijn schaatsers één verzoek `personal_records` (alle afstanden in één keer), hooguit 4 tegelijk, en per schaatser hooguit eens per 6 uur (eigen cache). Topschaatsers en schaatsers die alleen in de selectie staan, doen niet mee.
  - **Vergelijken:** de app onthoudt per schaatser het laatst geziene PR per afstand in een nieuwe sleutel `ssr.seen.v1` (`{ id: { afstand: tijd } }`). Snellere tijd dan het geziene PR = nieuw PR. De eerste keer (of voor een net toegevoegde schaatser) wordt alleen vastgelegd, zonder melding.
  - **Tonen:** een badge met het aantal op de knop Mijn schaatsers (mobiel: tabbalk; pc: kopbalk), en een lijst "Nieuwe PR's" met naam, afstand, nieuw PR, vorig PR, verbetering (s en %) en datum. Klik op een regel: schaatser aan de selectie toevoegen en die afstand openen.
  - **Gezien:** pas als de coach op **Alles gezien** klikt (of per regel ×) wordt `ssr.seen.v1` bijgewerkt. Even kijken laat de melding dus niet verdwijnen.
  - **Aandachtspunten:** v78 heeft juist het aantal verzoeken verlaagd; met veel schaatsers (max. 500) wordt dit veel verkeer. `personal_records` geeft 100/300/700 m niet altijd mee (zie v65). Zelf ingevoerde tijden (`ssr.manual.v1`) tellen niet mee.
  - **Besloten (20-11-2026):** automatisch controleren bij het openen; 100 en 300 m apart ophalen via `skater_results`, omdat SpeedskatingResults die niet als PR rapporteert.
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
