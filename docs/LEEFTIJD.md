# Leeftijd en geboortedatum

De vergelijking op leeftijd is de kern van de app. De API levert echter **geen geboortedatum**, alleen een leeftijdscategorie die geldt voor het lopende seizoen.

## Bepaling in de app

1. **Ingevuld door de gebruiker (exact op de maand):** maand + jaar via de keuzelijsten. De app rekent met de 15e van die maand. Bron: het profiel op SpeedskatingResults (link "profiel ↗"), waar staat bijvoorbeeld "December 1998".
2. **Geschat uit de categorie:** als er niets is ingevuld. In de app krijgen geschatte leeftijden een "≈".
3. **Onbekend:** de categorie ontbreekt in de API als de geboortedatum niet in hun database staat. De schaatser verschijnt dan niet in de grafiek en tabellen (de app meldt dit) totdat je een geboortedatum invult.

Leeftijden worden weergegeven als "12 j 6 m". In de grafiek staat leeftijd als decimaal getal (dagen / 365,2425).

## Categorie → leeftijd

Empirisch vastgesteld op 17-11-2026 door 130 NED-rijders te vergelijken: de categorie uit de API tegen de geboortemaand op hun profiel.

- **Jeugd t/m neo-senioren:** leeftijd op **1 juli van het beginjaar van het lopende seizoen**.

  | Code (API) | KNSB-naam in de app | Leeftijd op 1 juli |
  |---|---|---|
  | YF | Pupillen F | 7 (en jonger) |
  | YE | Pupillen E | 8 |
  | YD | Pupillen D | 9 |
  | YC | Pupillen C | 10 |
  | YB | Pupillen B | 11 |
  | YA | Pupillen A | 12 |
  | C1 / C2 | Junioren C1 / C2 | 13 / 14 |
  | B1 / B2 | Junioren B1 / B2 | 15 / 16 |
  | A1 / A2 | Junioren A1 / A2 | 17 / 18 |
  | N1 … N4 | Neo-senioren 1 … 4 | 19 … 22 |

- **SA → "Senioren":** 23 t/m 29 jaar (zelfde peildatum).
- **Masters (30, 35, …, 95, 00) → "Masters 30" enz.:** klassen van 5 jaar, met als peildatum **1 juli van het eindjaar van het seizoen** (één jaar later dan bij de jeugd). Voorbeeld: geboren januari 1997 is in seizoen 2026–27 al "30".

Voorbeeld seizoen 2026–27 (peildatum 1-7-2026): YB = geboren tussen 1 juli 2014 en 30 juni 2015.

## Nauwkeurigheid van de schatting

De app neemt het midden van het geboortevenster, afgerond op **1 januari**. Voorbeelden voor seizoen 2026–27: YB → 1-1-2015, SA → 1-1-2000, masters 30 → 1-1-1995.

| Categorie | Venster | Max. fout |
|---|---|---|
| Jeugd/junioren/neo | 1 jaar | ±6 maanden |
| SA | 7 jaar | ±3,5 jaar |
| Masters | 5 jaar | ±2,5 jaar |

**Advies:** vul voor senioren en masters altijd de geboortemaand in. Bij jeugd volstaat de schatting voor een globale vergelijking, maar voor "op de maand nauwkeurig" moet je ook daar invullen.

## Let op

- De categorie is die van **nu**. De app leidt de geboortedatum eenmalig af en rekent daarmee voor alle historische races.
- In juli schuift de seizoensgrens; de schatting rekent automatisch met het lopende seizoen.

## KNSB-namen en verschil met de KNSB-indeling

De app toont de categorieën met de KNSB-namen (bron: [KNSB – Wedstrijdschaatsen](https://knsb.nl/sporten/lange-en-kortebaanschaatsen/wedstrijdschaatsen/wedstrijdschaatsen/)). De KNSB gebruikt als peildatum 30 juni, met hetzelfde geboortevenster als hierboven. Voor seizoen 2026–27 is Pupillen B bijvoorbeeld geboren tussen 1-7-2014 en 30-6-2015.

Eén verschil: de KNSB rekent **Senioren** van 23 t/m 38 jaar en **Masters** vanaf 39 jaar. SpeedskatingResults volgt de internationale indeling met masters vanaf 30 jaar. Een 32-jarige heet in de app dus "Masters 30", terwijl de KNSB-wedstrijdindeling die schaatser bij Senioren rekent. Voor de leeftijdsberekening maakt dat niet uit.

## Jaarkeuze bij "Geboren" (vanaf v33)
De keuzelijst voor het geboortejaar toont alleen de jaren uit het geboortevenster van de categorie (`birthWindow`, dezelfde berekening als de schatting). Jeugd t/m neo-senioren: 2 jaren, senioren (SA): 8, masters: 6. Zonder herkende categorie: alle jaren; een al ingevuld jaar buiten het venster blijft zichtbaar. Maand en jaar moeten samen in het venster passen (`inBirthWindow`): bij het laagste jaar alleen jul–dec, bij het hoogste alleen jan–jun. Alles blijft kiesbaar; bij een conflict wint de laatste keuze (vanaf v35). Een nieuwe maand zet bij een 1-jaarscategorie het jaar op het passende jaar en maakt anders het jaar leeg; een nieuw jaar maakt de maand leeg. Bij een 1-jaarscategorie bepaalt de maand het jaar, dat automatisch wordt ingevuld.
