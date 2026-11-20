/*
  Schaatsvergelijker – vaste gegevens (vanaf v83 een apart bestand; tot v82 stond dit in index.html).

  Alleen gegevens, geen werking: de ANS-tabellen van de KNSB, de afkortingen van de Nederlandse banen en de
  ingebouwde lijst publiek bekende topschaatsers. Wordt vóór app.js geladen; de constanten zijn daar gewoon
  beschikbaar (gewone scripts delen hun bovenste niveau).

  Er staan bewust GEEN andere persoonsgegevens in dit bestand: alleen TOP_SKATERS (zie CLAUDE.md).
*/
'use strict';

/* ---------- ANS-correctie (KNSB, tabellen d.d. 14-07-2026) ----------
Percentage per baan en afstand; ANS-tijd = tijd x (1 - pct/100).
Positief = langzame baan (tijd wordt sneller), negatief = snelle baan (bv. Heerenveen). */
const ANS = {
  500: {
    Alkmaar: 0.01,
    Amsterdam: 1.49,
    Breda: 0.1,
    'Den Haag': -0.07,
    Deventer: 0.0,
    Eindhoven: 0.34,
    Enschede: -0.76,
    Geleen: 1.49,
    Groningen: -0.37,
    Haarlem: 0.57,
    Heerenveen: -2.16,
    Hoorn: 0.42,
    Leeuwarden: -0.94,
    Leiden: 0.92,
    Nijmegen: 0.92,
    Tilburg: 0.03,
    Utrecht: 0.32,
  },
  1000: {
    Alkmaar: 0.49,
    Amsterdam: 2.28,
    Breda: -0.24,
    'Den Haag': 0.32,
    Deventer: -0.21,
    Eindhoven: 0.74,
    Enschede: -1.09,
    Geleen: 2.28,
    Groningen: -0.8,
    Haarlem: 0.67,
    Heerenveen: -3.12,
    Hoorn: 0.77,
    Leeuwarden: -1.35,
    Leiden: 0.32,
    Nijmegen: 0.32,
    Tilburg: 0.24,
    Utrecht: 0.78,
  },
  1500: {
    Alkmaar: 0.12,
    Amsterdam: 3.17,
    Breda: 0.57,
    'Den Haag': -0.42,
    Deventer: 0.06,
    Eindhoven: 0.29,
    Enschede: -1.12,
    Geleen: 3.17,
    Groningen: -1.02,
    Haarlem: 0.8,
    Heerenveen: -3.28,
    Hoorn: 0.69,
    Leeuwarden: -1.53,
    Leiden: 0.03,
    Nijmegen: 0.03,
    Tilburg: 0.42,
    Utrecht: 0.94,
  },
  3000: {
    Alkmaar: 0.71,
    Amsterdam: 2.62,
    Breda: 0.38,
    'Den Haag': 0.59,
    Deventer: 0.46,
    Eindhoven: 0.85,
    Enschede: -1.14,
    Geleen: 2.62,
    Groningen: -1.01,
    Haarlem: 0.88,
    Heerenveen: -3.42,
    Hoorn: 0.48,
    Leeuwarden: -1.98,
    Leiden: -0.91,
    Nijmegen: -0.91,
    Tilburg: 0.71,
    Utrecht: 0.5,
  },
  5000: {
    Alkmaar: 0.23,
    Amsterdam: 4.07,
    Breda: 0.04,
    'Den Haag': 0.08,
    Deventer: -0.79,
    Eindhoven: 0.58,
    Enschede: -1.32,
    Geleen: 4.07,
    Groningen: -0.99,
    Haarlem: 0.17,
    Heerenveen: -3.62,
    Hoorn: 0.26,
    Leeuwarden: -0.47,
    Leiden: -0.69,
    Nijmegen: -0.69,
    Tilburg: 0.66,
    Utrecht: 1.69,
  },
};
/* Afstanden zonder eigen tabel: 100/300 m gebruiken 500 m, 700 m het gemiddelde van 500 en 1000 m, 10000 m gebruikt 5000 m. */
const ANS_BASE = {
  100: [500],
  300: [500],
  500: [500],
  700: [500, 1000],
  1000: [1000],
  1500: [1500],
  3000: [3000],
  5000: [5000],
  10000: [5000],
};

/* Afkortingen van de NL-banen zoals in de KNSB-ranglijsten op schaatsen.nl (vanaf v55),
   voor de toegevoegde tijden op het kaartje */
const RINK_SHORT = {
  Alkmaar: 'ALK',
  Amsterdam: 'AMS',
  Breda: 'BRE',
  'Den Haag': 'DNH',
  Deventer: 'DEV',
  Eindhoven: 'EVN',
  Enschede: 'ENS',
  Geleen: 'GEL',
  Groningen: 'GRO',
  Haarlem: 'HAA',
  Heerenveen: 'HVN',
  Hoorn: 'HRN',
  Leeuwarden: 'LEE',
  Leiden: 'LEI',
  Nijmegen: 'NYM',
  Tilburg: 'TIL',
  Utrecht: 'UTR',
};

/* Eén groep "Topschaatsers" (vanaf v80): de 25 bekendste uit de eerdere lijst (NL-podiumschaatsers
   2021–2026 plus Jordan Stolz en Miho Takagi). Alleen schaatsers met 500 m-tijden in hun jeugd (v41). */
const TOP_GROUP = 'Topschaatsers';
/* [id, voornaam, achternaam, geslacht, geboortemaand, land (standaard NED)] */
const TOP_SKATERS = [
  [32063, 'Joy', 'Beune', 'f', '1999-04'],
  [40443, 'Jenning', 'de Boo', 'm', '2004-01'],
  [6537, 'Marcel', 'Bosker', 'm', '1997-01'],
  [36256, 'Merel', 'Conijn', 'f', '2001-10'],
  [49350, 'Angel', 'Daleman', 'f', '2007-03'],
  [11169, 'Wesly', 'Dijs', 'm', '1995-09'],
  [35521, 'Marrit', 'Fledderus', 'f', '2001-05'],
  [49728, 'Isabel', 'Grevelt', 'f', '2002-04'],
  [29434, 'Marijke', 'Groenewoud', 'f', '1999-01'],
  [23864, 'Chris', 'Huizinga', 'm', '1997-08'],
  [18046, 'Michelle', 'de Jong', 'f', '1999-07'],
  [26647, 'Femke', 'Kok', 'f', '2000-10'],
  [31536, 'Jutta', 'Leerdam', 'f', '1998-12'],
  [46368, 'Tim', 'Prins', 'm', '2003-08'],
  [18036, 'Antoinette', 'Rijpma-de Jong', 'f', '1995-04'],
  [14920, 'Patrick', 'Roest', 'm', '1995-12'],
  [21597, 'Merijn', 'Scheperkamp', 'm', '2000-03'],
  [24522, 'Suzanne', 'Schulting', 'f', '1997-09'],
  [36004, 'Beau', 'Snellink', 'm', '2001-05'],
  [6588, 'Kai', 'Verbij', 'm', '1994-09'],
  [26322, 'Kayo', 'Vos', 'm', '2003-06'],
  [35048, 'Joep', 'Wennemars', 'm', '2002-10'],
  [48222, 'Stefan', 'Westenbroek', 'm', '2002-03'],
  [48139, 'Jordan', 'Stolz', 'm', '2004-05', 'USA'],
  [12830, 'Miho', 'Takagi', 'f', '1994-05', 'JPN'],
];
