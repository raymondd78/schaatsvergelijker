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

- [ ] Uitschieters filteren (bv. tijden > X % boven de PR van dat moment verbergen).
- [ ] Baan markeren in tooltip/kleur; filter op "alleen laaglandbanen".
- [ ] Overzichtsmatrix: PR per afstand per schaatser, met leeftijd bij het PR.
- [ ] Vergelijking "verschil t.o.v. referentieschaatser op dezelfde leeftijd" (in seconden of %).
- [ ] Geboortedata exporteren/importeren (JSON), zodat ze op een andere pc of browser bruikbaar zijn.
- [ ] Deelbare URL met geselecteerde schaatser-ID's en afstand.
- [ ] Grafiek als PNG en tabellen als CSV downloaden.
- [ ] Seizoensbesten (`season_bests`) als alternatieve weergave.
- [ ] Puntentotaal (samalog) voor allroundcombinaties.
- [ ] Git-repository in de projectmap zodra er schijfruimte is (zie `CLAUDE.md`).
