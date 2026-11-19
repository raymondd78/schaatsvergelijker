# Schaatsvergelijker

Statische webapp (één HTML-bestand) om de tijden en de PR-ontwikkeling van langebaanschaatsers te vergelijken, over de jaren heen en **op leeftijd**. Alle data komt live van [SpeedskatingResults.com](https://speedskatingresults.com) via hun publieke API.

## Doel

- Meerdere schaatsers tegelijk zoeken (op naam) en selecteren.
- Snel vergelijken met een Nederlandse topschaatser via de ingebouwde keuzelijst **Topschaatsers** (olympische medaille of WK/EK/WB-podium 2021–2026) of een internationale wereldkampioen.
- Per afstand (100, 300, 500, 700, 1000, 1500, 3000, 5000, 10000 m) alle gereden tijden en het PR-verloop zien.
- Schaatsers van verschillende leeftijden eerlijk vergelijken door de x-as op **leeftijd** te zetten in plaats van op datum of categorie. Zo kun je bijvoorbeeld een pupil van nu naast een topschaatser leggen toen die even oud was.

## Gebruik

1. Open `schaatsvergelijker.html` in een browser. Dubbelklikken werkt, een webserver is niet nodig.
   Online: https://raymondd78.github.io/schaatsvergelijker/ (GitHub Pages). In de GitHub-repository heet het bestand `index.html`; op de pc heet het `schaatsvergelijker.html`. Het is hetzelfde bestand.
2. Zoek een schaatser (achternaam en/of voornaam) en klik **+ Toevoegen**, of open een **schaatsersbestand (JSON)** met namen, groepen en geboortemaanden en voeg een hele groep in één keer toe (zie `docs/GROEPEN.md`). Met **Opslaan als JSON** bewaar je de huidige selectie als zo'n bestand.
3. Vul eventueel de **geboortemaand en het geboortejaar** in. Zonder die gegevens schat de app de leeftijd uit de categorie (zie `docs/LEEFTIJD.md`).
4. Kies een afstand. De x-as is altijd de **leeftijd**; schaatsers zonder bekende of geschatte leeftijd worden niet getoond.
5. Beperk eventueel de **leeftijdsperiode** ("Leeftijd van … t/m …"), bijvoorbeeld 8 t/m 13 jaar om een 12-jarige te vergelijken met een senior toen die even oud was.

**Privacy:** de webpagina zelf bevat geen persoonsgegevens, behalve de lijst publiek bekende topschaatsers (naam, geboortemaand, groep). Alle andere schaatsers staan in je eigen JSON-bestanden. De huidige selectie wordt alleen in de `localStorage` van je eigen browser bewaard (wissen met "Alles wissen"). Opgehaalde tijden worden 6 uur gecachet.

## Onderdelen van het scherm

| Onderdeel | Inhoud |
|---|---|
| Over deze tool | Uitlegblok bovenaan: standaard één zin, met "Meer…" uit te klappen (hoe werkt het, waarom de geboortemaand belangrijk is) |
| Zoeken | Op (begin van) achter- en/of voornaam, alle landen; max. 20 resultaten (XML-variant van de lookup-API) |
| Geselecteerd | Kleur per schaatser, ster om te highlighten, categorie, profiellink, bewerkbare groep, geboortedatum (maand + jaar) |
| Highlight | Ster ☆/★: gemarkeerde schaatsers krijgen een dikke lijn en liggen bovenop; de overige worden dan dunner |
| Grafiek | Tijd tegen leeftijd. PR-lijn (trap, met de stap op de datum van het nieuwe PR); optioneel alle gereden tijden (stippen, standaard uit). Namen staan aan het eind van elke lijn (geen legenda) |
| ANS | Vinkje "Alleen NL-banen, ANS-gecorrigeerd": alleen tijden op Nederlandse banen, omgerekend met de KNSB ANS-tabel (zie `docs/ANS.md`) |
| Tijd-as | Altijd verdeeld naar snelheid (zoals km/u): een verbetering bij een snelle tijd neemt meer ruimte in dan dezelfde procentuele verbetering bij een langzame tijd. Langs de as staan gewoon tijden |
| Filter m/v | Vinkjes om jongens/mannen of meisjes/vrouwen te verbergen in grafiek en tabellen; de selectie zelf blijft staan |
| Max. tijd | Keuzelijst om tijden langzamer dan een grens weg te laten (500 m in stappen van 10 s, andere afstanden naar rato); per afstand onthouden |
| Leeftijdsperiode | Keuzelijsten van/t/m (5–80 jaar); geldt voor grafiek en beide tabellen |
| Beste tijd per leeftijdsjaar | Kolommen per schaatser; vet = snelste op die leeftijd |
| PR-verloop | Elke PR met datum, leeftijd, verbetering, baan en wedstrijdlink |

## Bestanden

| Pad | Inhoud |
|---|---|
| `schaatsvergelijker.html` (in GitHub: `index.html`) | De app (HTML + CSS + JS, Chart.js via cdnjs) |
| `versies/` | Gedateerde kopieën van eerdere versies + `VERSIES.md` (logboek) |
| `docs/API.md` | Referentie van de SpeedskatingResults API, incl. live geverifieerde bevindingen |
| `docs/ANS.md` | ANS-correctietabel van de KNSB en hoe de app die toepast |
| `docs/LEEFTIJD.md` | Hoe leeftijd en geboortedatum worden bepaald of geschat |
| `docs/ARCHITECTUUR.md` | Opbouw van de code, datastromen en opslag |
| `data/` | Schaatsersbestanden (JSON) met persoonsgegevens; alleen lokaal |
| `docs/GROEPEN.md` | Formaat van de schaatsersbestanden, laden/opslaan en bijwerken per seizoen |
| `docs/BACKLOG.md` | Bekende beperkingen en ideeën voor uitbreiding |
| `CLAUDE.md` | Werkafspraken en context voor vervolgsessies met Claude |

## Voorwaarden databron

De API is gratis voor niet-commercieel gebruik. Vermeld dat de data van SpeedskatingResults.com komt en link ernaar; de app doet dat rechts in de kopbalk en in de footer.
