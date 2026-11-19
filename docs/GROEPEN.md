# Schaatsersbestanden (JSON) en groepen

De webpagina bevat **geen persoonsgegevens**, behalve de ingebouwde lijst publiek bekende topschaatsers (zie hieronder). Namen, groepen en geboortedata staan in een JSON-bestand dat je zelf bewaart en in de pagina opent. Het bestand wordt in de browser gelezen en niet naar een server gestuurd. Waar de pagina gehost wordt, staat dus niets over de schaatsers.

## Ingebouwde topschaatsers

Het blok **Topschaatsers** (tussen "Schaatser zoeken" en "Schaatsersbestand") bevat 42 van de 52 schaatsers uit `data/nl-topschaatsers-2021-2026.json`, plus 2 internationale wereldkampioenen: Jordan Stolz (USA) en Miho Takagi (JPN). Ze zijn ingebouwd in de pagina. Dat mag omdat het publiek bekende sporters zijn en er alleen naam, geslacht, geboortemaand en groep in staat.

**Selectie op jeugddata (vanaf v41, gecontroleerd 19-11-2026):** alleen schaatsers met 500m-tijden in hun jeugd blijven in de lijst. Ze moeten een tijd hebben op elke leeftijd van 12 t/m 18 jaar; hooguit één tussenjaar mag ontbreken, en 11 jaar mag ook ontbreken. Gecontroleerd met het console-script `check-topschaatsers-500m.js`. Vervallen (18):
- NL: Reina Anema, Jorrit Bergsma, Bart Hoolwerf, Sven Kramer, Thomas Krol, Dai Dai N'tab, Kjeld Nuis, Hein Otterspeer, Irene Schouten, Ireen Wüst.
- Internationaal: Pavel Kulizhnikov (mist 11 en 18), Davide Ghiotto, Shani Davis, Denis Yuskov, Martina Sáblíková, Brittany Bowe, Nao Kodaira, Claudia Pechstein.

In het JSON-bestand staan ze nog wel; ze ontbreken alleen in de ingebouwde lijst.

Nils van der Poel staat niet in SpeedskatingResults en is dus niet opgenomen. Een groep oud-schaatsers (Ritsma, Romme, Van Gennip e.a.) is in v15 geprobeerd en in v16 weer verwijderd: van hen staan te weinig tijden, zeker jeugdtijden, in de bron.

Kies een groep, "Alle topschaatsers" of één naam (vrouwen en mannen apart) en klik **Toevoegen**. Bijwerken: pas het JSON-bestand aan en genereer `TOP_SKATERS` opnieuw (één regel per schaatser: `[id, voornaam, achternaam, geslacht, geboortemaand, groepsbitmasker]`).

## In de pagina (eigen bestanden)

- **Bestand openen…**, of sleep een `.json` op het blok "Schaatsersbestand". De inhoud blijft alleen in het geheugen van het tabblad.
- **De bestandsnaam is de groep** (vanaf v47): `C-selectie.json` heet in de app "C-selectie". Je kunt meerdere bestanden openen; de keuzelijst toont elk bestand met het aantal schaatsers, en bij meer dan één bestand ook "Alle geladen schaatsers". Een bestand met dezelfde naam opnieuw openen vervangt het vorige.
- **Toevoegen:** voegt de schaatsers uit de gekozen groep toe. Staat een schaatser er al in, dan worden de geboortedatum en groep uit het bestand overgenomen.
- Bij elke geselecteerde schaatser staat de groep als tekst. Bewerken kan niet meer; pas daarvoor het bestand of de bestandsnaam aan.
- **Opslaan als JSON** (bij "Geselecteerd"): downloadt de huidige selectie, inclusief de handmatig ingevulde geboortemaanden. Er gaat geen groep mee; de naam die je het bestand geeft, wordt de groep als je het later opent.
- **Alles wissen:** maakt de selectie leeg.

Let op: de huidige selectie, met ingevulde geboortemaanden, wordt wel in de `localStorage` van **jouw** browser bewaard, zodat hij er na herladen nog is. Met "Alles wissen" verdwijnt die.

## Formaat

```json
{
  "format": "schaatsvergelijker/1",
  "description": "vrije tekst",
  "created": "2026-11-17",
  "skaters": [
    {
      "id": 12345,
      "name": "Voornaam Achternaam",
      "givenname": "Voornaam",
      "familyname": "Achternaam",
      "gender": "m",
      "country": "NED",
      "birth": "2014-02",
      "category": "YA",
      "catSeason": 2026
    }
  ]
}
```

| Veld | Verplicht | Betekenis |
|---|---|---|
| `id` | ja | Rijder-ID van SpeedskatingResults (`s=` in de profiel-URL) |
| `name` of `givenname` + `familyname` | aanbevolen | Weergavenaam |
| `birth` | nee | `JJJJ-MM` (of `JJJJ-MM-DD`). De app rekent met de 15e van de maand als er geen dag is. Zonder `birth` schat de app uit `category`. |
| `group` | nee | Wordt vanaf v47 genegeerd: de bestandsnaam is de groep. |
| `category`, `catSeason` | nee | Categoriecode volgens SpeedskatingResults en het seizoen (beginjaar) waarin die gold. Alleen nodig voor de schatting als `birth` ontbreekt. |
| `gender`, `country` | nee | Alleen voor de weergave |

Limieten (vanaf v30): maximaal **1 MB** en **100 schaatsers** per bestand. Schaatsers met een ongeldig of dubbel ID worden overgeslagen; namen (60/80 tekens) en groepen (60 tekens, max. 10 per schaatser) worden zo nodig ingekort.

Een bestand mag ook alleen een lijst (`[ … ]`) zijn in plaats van een object met `skaters`. Extra velden (zoals `medals`, `podiums`) negeert de app.

## Bestaande bestanden

Eigen schaatsersbestanden met persoonsgegevens (bijvoorbeeld van jeugdschaatsers) staan alleen lokaal in `data/`. Ze worden niet in de documentatie beschreven en komen niet in de webpagina, in het claude.ai-project of op GitHub.

### `data/olympische-medaillewinnaars-2022-2026.json`

13 Nederlandse **langebaan**schaatsers met een olympische medaille. Shorttrack staat niet in SpeedskatingResults en is dus niet opgenomen.
- "OS 2022 medaillewinnaars" (8 schaatsers, Beijing)
- "OS 2026 medaillewinnaars" (9 schaatsers, Milaan-Cortina)

Wie op beide Spelen een medaille won, staat in beide groepen. Het extra veld `medals` zegt welke medailles dat waren. Bron: de Wikipedia-pagina's "Netherlands at the 2022/2026 Winter Olympics".

### `data/nl-topschaatsers-2021-2026.json` (aanvulling; bevat ook de olympiërs)

52 Nederlandse langebaanschaatsers met minstens één podiumplaats op een WK, EK of wereldbeker in de seizoenen 2021–22 t/m 2026–27 (t/m WB #1, nov 2026). De 13 olympische medaillewinnaars zijn erin samengevoegd; ze stonden er allemaal al in. Groepen:

| Groep | Aantal |
|---|---|
| OS 2022 medaillewinnaars | 8 |
| OS 2026 medaillewinnaars | 9 |
| WK-podium 2021-26 | 26 |
| EK-podium 2021-26 | 33 |
| Wereldbeker-podium 2021-26 | 46 |

Extra velden: `podiums` (per WK, EK en Wereldbeker het aantal keer goud, zilver en brons) en `olympicMedals`.

Telregels. Geteld op 17-11-2026 uit de uitslagen op SpeedskatingResults:
- Wedstrijden: ISU World Cup, European Championships (allround, sprint, afstanden) en World Championships (allround, sprint, afstanden). Kwalificatietoernooien tellen niet mee.
- Wereldbeker: alleen Divisie A.
- Allround- en sprintkampioenschappen: het eindklassement telt, plus ploegenachtervolging, teamsprint en massastart. Losse afstanden binnen een allround of sprint tellen niet.
- Ploegonderdelen: elke ploeggenoot krijgt de podiumplaats.
- De tellingen zijn indicatief. Het gaat om de groepsindeling.

## Bijwerken voor een nieuw seizoen

1. Haal de namen van de teampagina's.
2. Zoek de ID's op via `api/json/skater_lookup.php?familyname=…&givenname=…&country=NED`. Controleer dubbele namen op categorie.
3. Haal de geboortemaand van `index.php?p=17&s=<id>` (element `<span class="date">`). Dat kan alleen vanaf het domein van SpeedskatingResults zelf, bijvoorbeeld door het via Claude in de ingebouwde browser te laten doen.
4. Zet alles in een nieuw JSON-bestand in `data/`.

Voor podiumlijsten:
1. Kandidaten via `topn` (NED, per seizoen en afstand).
2. Hun wedstrijden via `skater_competitions`.
3. Per wedstrijd de indexpagina `p=2&e=<id>`. De kolommen zijn `.halfcol` óf `.triplecol`, met groepskop `h3.groupname`.
4. Loop de uitslagpagina's `p=3` en `p=23` door op `td.rank` ≤ 3 en `td.ioc` = NED.
