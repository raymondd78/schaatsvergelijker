# CLAUDE.md – werkafspraken voor dit project

## Context

- Project: **Schaatsvergelijker**, een statische HTML-webapp op basis van de SpeedskatingResults.com API. Zie `README.md`.
- Lokale projectmap: `C:\Dev\SpeedskatingStatistics` (Windows-pc van Raymond).
- Ook opgeslagen in het claude.ai-project **SpeedskatingStatistics** (de docs; de app-bestanden staan in GitHub).
- De app bestaat vanaf v83 uit vier bestanden naast elkaar: `index.html`, `app.css`, `data.js` en `app.js` (tot v82 één bestand `schaatsvergelijker.html`).
- Taal: Nederlands (UI, documentatie en communicatie).

## Werkwijze bij een wijziging

1. Wijzig het bestand dat erbij hoort: schermindeling in `index.html`, opmaak in `app.css`, vaste gegevens (ANS, banen, topschaatsers) in `data.js`, werking in `app.js`.
2. Test indien mogelijk in de ingebouwde browser (zie `docs/ARCHITECTUUR.md` → Testen).
3. Schrijf de gewijzigde bestanden naar de hoofdmap van `C:\Dev\SpeedskatingStatistics` (alle vier staan naast elkaar).
   **Let op:** `device_commit_files` schreef twee keer een oudere versie weg terwijl het "written" meldde (bij een opnieuw gebruikt bronpad). Commit daarom vanaf een kopie met een unieke naam (bijv. `outputs/push/app_vNN.js`) en controleer achteraf met `device_stage_files` dat het bestand op de pc identiek is.
4. Werk het versienummer bij in `index.html`: `<span class="ver">` in de kopbalk (tekst en title) en de regel in de voettekst. Verhoog ook `CACHE` in `sw.js` (bijv. `schaatsvergelijker-v84`), anders blijft de oude offline-cache staan. Komt er een nieuw bestand bij, zet het dan ook in `APP_FILES` in `sw.js`.
5. Bewaar een kopie in `versies/` als map `JJJJ-MM-DD_UUMM_vN-korte-omschrijving/` met de vier bestanden (tot v82: één bestand `schaatsvergelijker_….html`). In git staat elke versie ook als commit.
6. Voeg een regel toe aan `versies/VERSIES.md` en een sectie aan `docs/RELEASENOTES.md`.
7. Werk de claude.ai-projectdocs bij.
8. Pas de documentatie in `docs/` aan als gedrag of opbouw verandert.
9. Commit naar GitHub (`raymondd78/schaatsvergelijker`, branch `main`) met als bericht `vNN: korte omschrijving`: de gewijzigde app-bestanden (`index.html`, `app.css`, `data.js`, `app.js`, `sw.js`), de gewijzigde `docs/` en eventueel `README.md`/`CLAUDE.md`. GitHub Pages publiceert `main` daarna automatisch op https://raymondd78.github.io/schaatsvergelijker/.

## Technische randvoorwaarden

- Geen build-stap; alleen Chart.js via cdnjs. App: `index.html`, `app.css`, `data.js`, `app.js` (vanaf v83; gewone scripts, geen ES-modules, zodat openen vanaf de pc blijft werken). Voor de PWA staan ernaast: `manifest.webmanifest`, `sw.js` en `icons/` (vanaf v63).
- Codestijl: opgemaakt met Prettier 3 (`--print-width 110 --single-quote`; voor `index.html` ook `--parser html --html-whitespace-sensitivity css`), met Nederlands commentaar per sectie en per functie. Houd die stijl aan bij wijzigingen.
- De app kan **niet** als claude.ai-artifact draaien (CSP blokkeert `fetch` naar externe domeinen).
- Versiebeheer: GitHub-repository **raymondd78/schaatsvergelijker** (publiek, vanaf 19-11-2026), branch `main`. Claude pusht vanuit de cloud-sessie; de pc is daarvoor niet nodig. `versies/` op de pc blijft als extra kopie bestaan, maar staat niet in de repository.
- `.gitignore` houdt `data/` en alle `.json`-bestanden buiten de repository (persoonsgegevens, o.a. van minderjarigen). Controleer vóór elke commit met `git status` dat er geen data meegaat.
- **Geen persoonsgegevens in de app-bestanden** (geen namen, ID-lijsten of geboortedata). Die horen in JSON-bestanden in `data/`, die niet in het claude.ai-project worden gezet.
- **Uitzondering:** de ingebouwde lijst `TOP_SKATERS` in `data.js` met publiek bekende topschaatsers (NL: olympische medaille of WK/EK/WB-podium; plus 10 internationale wereldkampioenen). Op verzoek van Raymond (17-11-2026); alleen ID, naam, geslacht, geboortemaand en groep. Bron: `data/nl-topschaatsers-2021-2026.json`. Nooit uitbreiden met jeugd- of clubschaatsers.
- Houd de bronvermelding naar SpeedskatingResults.com in de footer (licentievoorwaarde).
