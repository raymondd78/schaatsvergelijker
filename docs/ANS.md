# ANS-correctie (Nederlandse ijsbanen)

Niet elke ijsbaan is even snel. De KNSB gebruikt ANS-tabellen om tijden van verschillende Nederlandse banen vergelijkbaar te maken. Bron: [KNSB – Tabellen ANS (260714)](https://knsb.nl/media/documents/260714_Tabellen_ANS.pdf), gedateerd 14-07-2026.

## In de app

Het vinkje **"Alleen NL-banen, ANS-gecorrigeerd"** doet twee dingen:
1. **Filteren.** Alleen tijden op banen uit de ANS-tabel blijven over. Buitenlandse banen, en Nederlandse banen die niet in de tabel staan (bijv. Dronten, Zoetermeer), vallen weg.
2. **Omrekenen.** Elke tijd wordt omgerekend met **ANS-tijd = gereden tijd × (1 − correctie%/100)**.

PR-lijn, PR-verloop en "Beste tijd per leeftijdsjaar" worden dan berekend op de ANS-tijden. Het PR-verloop krijgt een extra kolom "Gereden" met de echte tijd. De tooltip toont ook de gereden tijd en het correctiepercentage.

## Correctiepercentages

Een negatief percentage betekent een snelle baan: de tijd wordt langzamer gemaakt. Thialf (Heerenveen) is de snelste baan. Een positief percentage betekent een langzame baan, zoals een buitenbaan (Amsterdam) of een baan zonder dak (Geleen).

| Baan | 500 m | 1000 m | 1500 m | 3000 m | 5000 m |
|---|---|---|---|---|---|
| Alkmaar | 0,01 | 0,49 | 0,12 | 0,71 | 0,23 |
| Amsterdam | 1,49 | 2,28 | 3,17 | 2,62 | 4,07 |
| Breda | 0,10 | −0,24 | 0,57 | 0,38 | 0,04 |
| Den Haag | −0,07 | 0,32 | −0,42 | 0,59 | 0,08 |
| Deventer | 0,00 | −0,21 | 0,06 | 0,46 | −0,79 |
| Eindhoven | 0,34 | 0,74 | 0,29 | 0,85 | 0,58 |
| Enschede | −0,76 | −1,09 | −1,12 | −1,14 | −1,32 |
| Geleen | 1,49 | 2,28 | 3,17 | 2,62 | 4,07 |
| Groningen | −0,37 | −0,80 | −1,02 | −1,01 | −0,99 |
| Haarlem | 0,57 | 0,67 | 0,80 | 0,88 | 0,17 |
| Heerenveen | −2,16 | −3,12 | −3,28 | −3,42 | −3,62 |
| Hoorn | 0,42 | 0,77 | 0,69 | 0,48 | 0,26 |
| Leeuwarden | −0,94 | −1,35 | −1,53 | −1,98 | −0,47 |
| Leiden | 0,92 | 0,32 | 0,03 | −0,91 | −0,69 |
| Nijmegen | 0,92 | 0,32 | 0,03 | −0,91 | −0,69 |
| Tilburg | 0,03 | 0,24 | 0,42 | 0,71 | 0,66 |
| Utrecht | 0,32 | 0,78 | 0,94 | 0,50 | 1,69 |

Controle met het voorbeeld uit de tabel: 40,00 op de 500 m in Heerenveen geeft 40,00 × 1,0216 = 40,86.

## Afstanden zonder eigen tabel (aanname)

De KNSB-tabel heeft alleen 500, 1000, 1500, 3000 en 5000 m. Voor de andere afstanden gebruikt de app een afgeleide waarde. Dat meldt hij ook bij de grafiek.

| Afstand | Gebruikte correctie |
|---|---|
| 100 m, 300 m | 500 m-tabel |
| 700 m | gemiddelde van 500 en 1000 m |
| 10000 m | 5000 m-tabel |

## Baannamen

De baan wordt herkend aan de locatie in SpeedskatingResults, bijvoorbeeld `Heerenveen (NED)` of `Den Haag (NED)`. Komt er een nieuwe tabel van de KNSB, werk dan de constante `ANS` in `schaatsvergelijker.html` bij, en dit document.
