# SpeedskatingResults.com – Public API

Bron: <https://speedskatingresults.com/index.php?p=200> (en subpagina's p=201 t/m p=212).

## Algemeen

- Elk endpoint bestaat als XML en als JSON:
  `https://speedskatingresults.com/api/xml/<naam>.php` en `https://speedskatingresults.com/api/json/<naam>.php`
  (de voorbeelden op de site laten `.php` soms weg).
- Geen authenticatie; de documentatie noemt geen rate limits en geen foutformaat.
- Gratis voor niet-commercieel gebruik, met bronvermelding en link verplicht.

## Live geverifieerd (17-11-2026, vanuit de browser)

- **CORS:** `Access-Control-Allow-Origin: *` op de API-endpoints, dus ze zijn direct aan te roepen vanuit een statische pagina op elk domein of vanaf `file://`.
- **`skater_results` zonder `season`** geeft **alle seizoenen** terug.
- **De afstanden 100, 300 en 700 m werken** in `skater_results`, ook al noemt de documentatie alleen voorbeelden als 500.
- **Resultaten zijn gesorteerd op tijd, niet op datum.** De app sorteert ze zelf op datum.
- **`skater_lookup`:** JSON geeft max. 10 resultaten, XML max. 20 (de app gebruikt XML).
- **`category`** is in JSON een string (`"SA"`, `"YB"`) of een **getal** voor masters (`60`).
- **De geboortedatum zit niet in de API.** De site toont alleen maand + jaar op de rijderspagina (`index.php?p=17&s=<id>`, element `<span class="date">December 1998 (LSA)</span>`). Die HTML-pagina heeft **geen CORS-header** en is dus niet uit te lezen door een pagina op een ander domein.
- Tijden zijn tekst in de notatie `ss,hh` of `m.ss,hh` (bv. `37,01`, `1.09,22`).

## Endpoints

| Groep | Endpoint | Verplicht | Optioneel |
|---|---|---|---|
| Rijder | `skater_lookup` | min. één van de optionele | `familyname`, `givenname` (begin van de naam volstaat), `country` (IOC), `gender` (m/f) |
| Rijder | `skater_competitions` | `skater` | `season` |
| Rijder | `skater_results` | `skater`, `distance` | `season` |
| Rijder | `personal_records` | `skater` | `distance` |
| Rijder | `season_bests` | `skater` | `start`, `end`, `distance` |
| Rijder | `seed_times` | `skater`, `start`, `end` (YYYY-MM-DD) | `distance` |
| Records | `world_records` | – | `gender`, `age` (jr/sr), `distance` |
| Records | `olympic_records` | – | `gender`, `distance` |
| Records | `country_records` | `country` | `gender`, `age`, `distance` |
| Records | `masters_records` | – | `gender`, `age` (30, 35, …), `distance` |
| Baan | `track_competitions` | `track` | `season` |
| Seizoen | `topn` | `gender` | `season`, `distance`, `skater` (y/n), `max` (1–500), `country` óf `track`, `age` |

## Parameters en conventies

- **`season`** = beginjaar van het seizoen (2025 = 2025–2026). Zonder `season` krijg je het huidige seizoen; uitzondering is `skater_results`, dat dan alle seizoenen geeft.
- **`season_bests`**: `start=0` geeft alle seizoenen. Data vanaf 2007–08; 100/300/700 m vanaf 2016–17, 200/400 m vanaf 2017–18.
- **`topn`**: `distance` kent ook 100/200/300/400/700; `age` accepteert categoriecodes (Y, YA–YF, C, C1, C2, B, B1, B2, A, A1, A2, JR, N, N1–N4, SA, M, 30…95, 00). Baan-ID's: 1 Salt Lake City, 2 Lake Placid, 5 Calgary, 8 Hamar, 9 Heerenveen, 11 Inzell.
- **Rijder-ID** = de `s`-parameter in de profiel-URL, of op te zoeken via `skater_lookup`.

## Voorbeelden van responses

`skater_results.php?skater=99063&distance=300` (JSON):

```json
{"skater":99063, "distance":300, "results":[
  {"time":"40,40", "date":"2026-03-22", "location":"Den Haag (NED)",
   "name":"CK DKIJV 2026", "link":"http://speedskatingresults.com/index.php?p=3&e=32005&r=10001&s=99063"}
]}
```

`skater_lookup.php?familyname=leerdam&country=NED` (JSON):

```json
{"skaters":[
  {"id":67309, "familyname":"Leerdam", "givenname":"Arjan", "country":"NED", "gender":"m", "category":60},
  {"id":31536, "familyname":"Leerdam", "givenname":"Jutta", "country":"NED", "gender":"f", "category":"SA"}
]}
```

## Inconsistenties in de officiële documentatie

- XML- en JSON-voorbeelden tonen soms andere waarden voor dezelfde query (categorie, PR, seed time).
- Het `topn`-voorbeeld gebruikt `country=6` terwijl een IOC-code bedoeld is.
- In een JSON-voorbeeld worden tekens met accenten verkeerd weergegeven (bv. "HÃ¸iseth").
