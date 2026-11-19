# CLAUDE.md – werkafspraken voor dit project

## Context

- Project: **Schaatsvergelijker**, een statische HTML-webapp op basis van de SpeedskatingResults.com API. Zie `README.md`.
- Lokale projectmap: `C:\Dev\SpeedskatingStatistics` (Windows-pc van Raymond).
- Ook opgeslagen in het claude.ai-project **SpeedskatingStatistics** (`schaatsvergelijker.html`, `claude/schaatsvergelijker.html`).
- Taal: Nederlands (UI, documentatie en communicatie).

## Werkwijze bij een wijziging

1. Wijzig `schaatsvergelijker.html`.
2. Test indien mogelijk in de ingebouwde browser (zie `docs/ARCHITECTUUR.md` → Testen).
3. Schrijf het bestand naar de hoofdmap van `C:\Dev\SpeedskatingStatistics`.
   **Let op:** `device_commit_files` schreef twee keer een oudere versie weg terwijl het "written" meldde (bij een opnieuw gebruikt bronpad). Commit daarom vanaf een kopie met een unieke naam (bijv. `outputs/push/schaatsvergelijker_vNN.html`) en controleer achteraf met `device_stage_files` dat het bestand op de pc identiek is.
4. Werk het versienummer in de pagina bij: `<span class="ver">` in de kopbalk (tekst en title) en de regel in de voettekst.
5. Bewaar een kopie in `versies/` als `schaatsvergelijker_JJJJ-MM-DD_UUMM_vN-korte-omschrijving.html`.
6. Voeg een regel toe aan `versies/VERSIES.md` en een sectie aan `docs/RELEASENOTES.md`.
7. Werk de claude.ai-projectdocs bij.
8. Pas de documentatie in `docs/` aan als gedrag of opbouw verandert.

## Technische randvoorwaarden

- Eén bestand, geen build-stap; alleen Chart.js via cdnjs.
- Codestijl: opgemaakt met Prettier 3 (`--parser html --print-width 110 --single-quote --html-whitespace-sensitivity css`), met Nederlands commentaar per sectie en per functie. Houd die stijl aan bij wijzigingen.
- De app kan **niet** als claude.ai-artifact draaien (CSP blokkeert `fetch` naar externe domeinen).
- Git is nog niet mogelijk: de Linux-omgeving op de pc start niet door te weinig vrije schijfruimte (vereist tot 17 GB). Versiebeheer gebeurt daarom via `versies/`.
- **Geen persoonsgegevens in `schaatsvergelijker.html`** (geen namen, ID-lijsten of geboortedata). Die horen in JSON-bestanden in `data/`, die niet in het claude.ai-project worden gezet.
- **Uitzondering:** de ingebouwde lijst `TOP_SKATERS` met publiek bekende topschaatsers (NL: olympische medaille of WK/EK/WB-podium; plus 10 internationale wereldkampioenen). Op verzoek van Raymond (17-11-2026); alleen ID, naam, geslacht, geboortemaand en groep. Bron: `data/nl-topschaatsers-2021-2026.json`. Nooit uitbreiden met jeugd- of clubschaatsers.
- Houd de bronvermelding naar SpeedskatingResults.com in de footer (licentievoorwaarde).
