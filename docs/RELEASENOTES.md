# Release notes – Schaatsvergelijker

Overzicht van alle versies van `schaatsvergelijker.html`, nieuwste eerst. De technische logregels per versie staan in `versies/VERSIES.md`; daar staan ook de bestandsnamen om een oude versie terug te zetten.

**Huidige versie: v54** (19 november 2026)

---

## v54 – Heren/Dames en compacter kaartje (19-11-2026)
- Categorie met geslacht, zoals gebruikelijk: "Heren Pupillen C", "Dames Junioren C1" (ook in de zoekresultaten). Het filter heet nu **Heren** / **Dames** in plaats van m / v.
- Het land staat niet meer op het kaartje (wel nog bij de zoekresultaten).
- Zelf ingevoerde tijden staan onder **Toegevoegd**, zonder pennetje en met een afgekorte baan (bijv. Hvn, Gron, Adam; de volledige naam staat in de tooltip).

## v53 – Groepslabels apart (19-11-2026)
- Hoort een schaatser bij meerdere groepen (zoals topschaatsers met WK-, EK- en wereldbekerpodium), dan krijgt elke groep een eigen klein label in plaats van één lang blok.

## v52 – Rustiger schaatserkaartje (19-11-2026)
- Profiellink als klein ↗ achter de naam; daaronder één regel met categorie, m/v en land, en de groep als klein label.
- Onder een scheidingslijn vaste rijen met links een label: **Geboren** (bijv. "feb 2014 · 12 jr 9 mnd", klikbaar om te wijzigen) en **Eigen** (zelf ingevoerde tijden, zonder jaartal als het dit jaar is).
- Maand en jaar staan naast elkaar. Is de geboortedatum nog niet ingevuld, dan staat de schatting er in oranje onder ("≈ geschat: 1 jan 2013 (±6 mnd)").
- **+ tijd** staat rechtsonder; het invoerformulier opent als rij in het kaartje, met **Opslaan** en **Annuleren**.

## v51 – Zelf een tijd invoeren (19-11-2026)
- Op elk kaartje bij **Geselecteerd** staat **+ tijd**: voer een zojuist gereden tijd in die nog niet op SpeedskatingResults staat. Je kiest afstand (standaard het tabblad dat open staat), tijd (bijv. 46,10 of 1.23,45), datum (standaard vandaag) en baan. De laatst gekozen baan wordt onthouden.
- De tijd telt overal mee: PR-lijn, alle gereden tijden, beide tabellen en de ANS-correctie (daarvoor is de baan nodig; "buitenland/anders" valt weg als ANS aan staat). In de grafiek staat zo'n tijd als **open stip**, in de tabellen met een ✎.
- Zodra dezelfde tijd op SpeedskatingResults verschijnt, verdwijnt je eigen invoer vanzelf. Met × haal je hem eerder weg.
- Alleen in je browser bewaard; niet in "Opslaan als JSON".

## v50 – Geen label geschat/ingevuld meer (19-11-2026)
- Bij **Geselecteerd** zijn de labels "ingevuld" en "geschat" weg. Een ingevulde datum herken je aan de klikbare tekst; bij een schatting staat de geschatte datum eronder, bij senioren en masters met de marge (bijv. ±5 jr).

## v49 – Ingevulde geboortedatum als tekst (19-11-2026)
- Bij **Geselecteerd** staat een ingevulde geboortedatum als tekst, bijvoorbeeld "Geboren maart 2013", zonder keuzelijsten.
- Klik op de datum om hem te wijzigen: dan verschijnen de keuzelijsten weer, met **Klaar** en × (wissen).
- Zonder geboortedatum staan de keuzelijsten er gewoon; zodra maand en jaar zijn ingevuld, wordt het tekst.

## v48 – PR-verloop per schaatser (19-11-2026)
- Boven het **PR-verloop** staat een keuzelijst **Schaatser**: de tabel toont dan alleen de PR's van die schaatser in plaats van één lange lijst. Met "Alle schaatsers" zie je weer iedereen, bijvoorbeeld om met "nieuwste eerst" de laatste PR's van de hele groep te bekijken.
- Standaard staat de eerste gehighlighte schaatser gekozen, anders de eerste in je selectie.

## v47 – Groep is bestandsnaam, donkere modus (19-11-2026)
- **Groepen eenvoudiger:** de naam van een schaatsersbestand is de groep (`C-selectie.json` → "C-selectie"). Je kunt meerdere bestanden tegelijk openen; de keuzelijst toont elk bestand plus "Alle geladen schaatsers". Het groepsveld bij elke geselecteerde schaatser is weg; de groep staat er als tekst. "Opslaan als JSON" bewaart geen groep meer: de naam die je het bestand geeft, wordt de groep.
- **Eén melding bij zoeken:** de uitleg over de geboortemaand staat één keer boven de zoekresultaten in plaats van bij elke schaatser. Een ingevulde schaatser krijgt een ✓.
- **Donkere modus:** volgt automatisch de instelling van je telefoon of computer. Met de knop **Thema** in de kopbalk kies je vast licht of donker, of weer automatisch.

## v46 – Geboortedatum al bij het zoeken (19-11-2026)
- Bij elk zoekresultaat kies je de **geboortemaand en het geboortejaar** al vóór je op **+ Toevoegen** klikt. Dezelfde regels als bij Geselecteerd: alleen jaren die bij de categorie passen, en de laatste keuze wint.
- Een oranje melding wijst erop dat de geboortemaand belangrijk is, met een link naar het profiel waar die staat, en hoeveel de geschatte leeftijd anders kan afwijken (bijv. ±6 maanden of ±4 jaar). Na invullen wordt de melding groen.
- Achteraf invullen bij Geselecteerd kan nog steeds.

## v45 – Liggende stand nauwkeuriger (19-11-2026)
- Opent het toetsenbord op een telefoon die rechtop wordt gehouden (bijvoorbeeld bij zoeken), dan schakelt de pagina niet meer per ongeluk naar de liggende weergave.

## v44 – Mobiel bijgewerkt (19-11-2026)
- De keuze PR-verloop / Per leeftijd staat alleen nog in het tabblad Tabellen (stond ook onder de grafiek).
- De kaartjes in het PR-verloop zijn overal gelijk opgebouwd: bovenaan naam en tijd, daaronder datum, leeftijd, baan en verbetering.

## v43 – Mobiele weergave (19-11-2026)
Op een telefoon (scherm smaller dan 800 pixels) ziet de pagina er anders uit; op desktop verandert er niets.
- **Tabbalk onderin** met Schaatsers, Grafiek en Tabellen. De pagina opent op Grafiek, of op Schaatsers als er nog niemand gekozen is.
- **Grafiek:** de afstanden staan in een balk die je opzij schuift. Alle filters zitten achter de knop **Filters**, in een paneel dat van onderen opschuift; boven de grafiek staat een korte samenvatting. Onder de grafiek staat elke schaatser als gekleurde knop: tik erop om te highlighten.
- **Namen aan de lijn:** alleen van gehighlighte schaatsers, zodat ze elkaar niet in de weg zitten.
- **Tabellen:** kies tussen **PR-verloop** en **Per leeftijd**. Het PR-verloop staat als lijst met kaartjes, standaard met de nieuwste PR's bovenaan. In de tabel per leeftijd blijft de leeftijdskolom staan als je opzij schuift.
- **Telefoon liggend:** alleen de grafiek, over het hele scherm, met alle namen.

## v42 – Kleinere namen, klikken naast de grafiek (19-11-2026)
- De namen aan het eind van de lijnen zijn kleiner (10 in plaats van 12 pixels) en staan dichter op elkaar, zodat ze elkaar minder snel in de weg zitten.
- Klikken op een naam die rechts **naast** de grafiek staat (omdat de schaatser nog tijden buiten de leeftijdsperiode heeft), zet nu ook de highlight aan of uit. Ook daar verschijnt een handje.

## v41 – Topschaatsers met jeugdtijden (19-11-2026)
- De lijst **Topschaatsers** bevat alleen nog schaatsers van wie ook de jeugdtijden in de bron staan: een 500m-tijd op elke leeftijd van 12 t/m 18 jaar, waarbij hooguit één tussenjaar mag ontbreken (11 jaar mag ook ontbreken). Zo heeft vergelijken met een jeugdschaatser altijd zin.
- 18 schaatsers vallen weg, onder wie Sven Kramer, Ireen Wüst, Kjeld Nuis en Irene Schouten, en 8 van de 10 internationale wereldkampioenen. Er blijven er 44 over, met Jordan Stolz en Miho Takagi als internationale schaatsers.

## v40 – Highlighten vanuit de grafiek (18-11-2026)
- Klik in de grafiek op een **lijn, stip of naam**: de ster van die schaatser gaat aan en de lijn wordt vet. Nog een klik zet het weer uit.
- Boven iets klikbaars verandert de muisaanwijzer in een handje. Tooltips werken zoals voorheen.

## v39 – PR-verloop sorteren op datum (18-11-2026)
- Klik in het **PR-verloop** op de kolomkop **Datum** om te sorteren: eerst nieuwste bovenaan (▼), nog een klik oudste bovenaan (▲), nog een klik terug naar de gewone volgorde per schaatser.
- De gewone volgorde blijft de standaard; de keuze geldt tot je de pagina herlaadt.

## v38 – Beter bestand tegen een trage server (18-11-2026)
- **Grafiek groeit mee tijdens het laden:** schaatsers verschijnen zodra hun tijden binnen zijn (hooguit eens per seconde bijgewerkt), in plaats van pas als de traagste binnen is.
- **Oudere tijden als noodoplossing:** reageert SpeedskatingResults niet, dan gebruikt de app eerder opgehaalde tijden uit de browser, ook als die ouder zijn dan 6 uur. De statusregel meldt dat, met het tijdstip van de oudste gegevens.
- **Knop "Opnieuw proberen"** bij een fout of bij oudere tijden: haalt alleen die schaatsers opnieuw op.

## v37 – Fix: vastlopen met veel schaatsers (18-11-2026)
- De echte oorzaak van het vastlopen is gevonden: het plaatsen van de namen aan het eind van de lijnen. Bij veel schaatsers (zoals een bestand met 29) schoven twee namen door een afrondingsfout eindeloos heen en weer. Dat is opgelost.
- Getest met 29 en 52 schaatsers op alle afstanden.

## v36 – Fix: pagina liep vast (18-11-2026)
- De pagina kon vastlopen met hoog processorgebruik. Oorzaak: als alle getoonde tijden (bijna) gelijk waren, bijvoorbeeld door filters of één race, bleef de berekening van de tijden langs de as eindeloos doorgaan. Dat is opgelost; de as krijgt dan gewoon een kleine marge.
- Het lag niet aan SpeedskatingResults: wachten op de server kost geen processortijd.

## v35 – Maand en jaar: laatste keuze wint (18-11-2026)
- De uitgeschakelde maanden en jaren uit v34 zijn weg: daardoor kon je een vergissing niet meer herstellen. Alle jaren van de categorie en alle maanden zijn weer te kiezen.
- Past je nieuwe keuze niet bij de andere, dan wint de laatste keuze:
  - nieuwe **maand**: bij een categorie van één jaar springt het jaar naar het passende jaar (bij C1 2026-27: aug → 2012, jan → 2013); bij senioren en masters wordt het jaar leeggemaakt;
  - nieuw **jaar**: de maand wordt leeggemaakt, zodat je die opnieuw kiest.
- Kies je bij een categorie van één jaar alleen een maand, dan vult de app het jaar zelf in (zoals in v34).

## v34 – Maand en jaar passen bij elkaar (18-11-2026)
- Kies je bij **Geboren** het laagste jaar van de categorie, dan zijn januari t/m juni niet te kiezen; bij het hoogste jaar juli t/m december.
- Kies je eerst een maand, dan zijn alleen de jaren te kiezen waarin die maand bij de categorie past. Bij een categorie van één jaar (pupillen t/m neo-senioren) vult de app het jaar dan meteen zelf in, en is de geboortedatum compleet.

## v33 – Geboortejaar passend bij categorie (18-11-2026)
- Bij **Geboren** toont de jaarkeuze alleen de jaren die bij de leeftijdscategorie passen (bijv. bij C1 in 2026-27: 2012 en 2013). Zonder bekende categorie blijven alle jaren beschikbaar.
- Een eerder ingevuld jaar dat buiten de categorie valt, blijft zichtbaar zodat het niet verloren gaat.

## v32 – Kortere uitleg (18-11-2026)
- De zin over de verdeling van de tijd-as is uit "Over deze tool" gehaald.

## v31 – Altijd snelheidsschaal (18-11-2026)
- De keuzelijst **Schaal** is weg: de tijd-as is altijd verdeeld naar snelheid. Een verbetering bij een snelle tijd neemt meer ruimte in dan dezelfde procentuele verbetering bij een langzame tijd. Langs de as staan gewoon tijden.
- De log-schaal wordt niet meer genoemd in "Over deze tool".

## v30 – Beveiliging: invoercontrole (18-11-2026)
Naar aanleiding van een securityreview (punt 1 t/m 4). Voor de gebruiker verandert er niets, behalve de nieuwe limieten.
- **Wedstrijdlinks** in het PR-verloop worden alleen een link als ze naar `https://speedskatingresults.com` wijzen; anders staat alleen de wedstrijdnaam er.
- **Opgeslagen gegevens** in de browser (selectie, instellingen en de cache met tijden) worden bij het laden gecontroleerd. Ongeldige of gemanipuleerde gegevens vallen weg; de cache wordt dan opnieuw opgehaald.
- **Schaatsersbestanden (JSON):** maximaal 1 MB en 100 schaatsers; ongeldige of dubbele ID's worden overgeslagen; namen en groepen hebben een maximale lengte.
- **API:** antwoorden worden gecontroleerd; een verzoek dat na 15 seconden geen antwoord heeft, wordt afgebroken met een foutmelding in plaats van eindeloos "Laden…".
- De selectie bevat maximaal **100 schaatsers**.

## v29 – Versienummer zichtbaar (18-11-2026)
- Klein versienummer achter de titel in de kopbalk, en versie plus datum in de voettekst. Zo zie je meteen welke versie je open hebt.

## v28 – Leesbare code (18-11-2026)
- Alleen onderhoud, geen zichtbare wijzigingen: de code is netjes opgemaakt en voorzien van Nederlands commentaar (uitleg per onderdeel en per functie).
- Gecontroleerd dat de werking precies gelijk is gebleven aan v27.

## v27 – Namen aan de lijn (18-11-2026)
- De naam van elke schaatser staat aan het eind van zijn of haar lijn, in de eigen kleur. Gehighlighte schaatsers staan vet.
- Namen die elkaar zouden raken, schuiven automatisch uit elkaar. Een wit randje houdt ze leesbaar boven andere lijnen.
- De legenda is weg; rechts van de grafiek komt ruimte vrij voor de namen.

## v26 – Schaal: tijd, log of snelheid (17-11-2026)
- Het vinkje "Log-schaal" is vervangen door de keuzelijst **Schaal**:
  - **tijd**: elke seconde even hoog (verbetering van beginners valt op);
  - **log**: elk percentage verbetering even hoog;
  - **snelheid**: verdeling zoals km/u, zodat verbetering bij snelle tijden meer opvalt.
- Op de as staan altijd tijden. Een eerder gekozen log-schaal blijft behouden.

## v25 – (teruggedraaid)
- PR-verloop sorteren op datum met de nieuwste bovenaan. Op verzoek teruggedraaid; de pagina is weer gelijk aan v24.

## v24 – Korter uitlegblok (17-11-2026)
- "Over deze tool" toont standaard één zin: *vergelijk PR's op leeftijd in plaats van op categorie*. Met **Meer…** klap je de rest uit, met **Minder** weer in.

## v23 – Uitleg en bronvermelding (17-11-2026)
- Nieuw blok **Over deze tool** bovenaan: wat de tool doet, hoe hij werkt, en waarom de geboortemaand belangrijk is.
- Bronvermelding "Data: SpeedskatingResults.com (Public API, niet-commercieel gebruik)" ook rechts in de kopbalk.
- De voettekst zegt nu dat onbekende leeftijden worden geschat op de middelste datum van de leeftijdscategorie.

## v22 – PR-lijn loopt rechts door (17-11-2026)
- Met een eindleeftijd loopt de PR-lijn door tot de rechterrand als de schaatser daarna nog heeft gereden, net zoals de lijn links op de beginleeftijd start. Een gestopte schaatser eindigt bij de laatste race.

## v21 – Maximale tijd (17-11-2026)
- Keuzelijst **Max. tijd**: tijden langzamer dan de grens worden weggelaten.
- Stappen van 10 seconden op de 500 m, naar rato op andere afstanden (100 m: 2 s, 1500 m: 30 s, 10.000 m: 200 s).
- Per afstand onthouden. Werkt na de ANS-correctie en geldt ook voor de PR-lijn en de tabellen.

## v20 – Highlighten (17-11-2026)
- Ster ☆/★ bij elke geselecteerde schaatser. Gehighlighte schaatsers krijgen een dikke lijn en grotere stippen en liggen bovenop.
- Zodra iemand gehighlight is, worden de andere lijnen dunner.

## v19 – Log-schaal (17-11-2026)
- Vinkje voor een logaritmische tijd-as, zodat een gelijk percentage verbetering overal even hoog is. Met ronde tijdstappen langs de as. (In v26 opgegaan in de keuzelijst Schaal.)

## v18 – Groep bewerken (17-11-2026)
- Elke geselecteerde schaatser heeft een bewerkbaar veld **Groep**, met suggesties uit bestaande groepen. Meerdere groepen scheid je met een komma.
- De groepen gaan mee bij **Opslaan als JSON**.
- De keuze voor geslacht bij zoeken is verwijderd.

## v17 – Layout over de volle breedte (17-11-2026)
- De pagina is links uitgelijnd en gebruikt de volle breedte; de grafiek krijgt alle ruimte die over is.
- De pagina scrolt niet meer horizontaal, dus de kopbalk loopt altijd door.
- "(begin)" weg bij de zoekvelden.

## v16 – Oud-schaatsers verwijderd (17-11-2026)
- De groep "Oud-schaatsers NL" is weer weggehaald: van hen staat te weinig data in de bron, zeker uit hun jeugd.

## v15 – Internationale wereldkampioenen (17-11-2026)
- Topschaatsers uitgebreid met 10 internationale wereldkampioenen: Stolz, Kulizhnikov, Ghiotto, Davis, Yuskov, Takagi, Sáblíková, Bowe, Kodaira en Pechstein.
- (Ook 10 Nederlandse oud-schaatsers, die in v16 weer zijn verwijderd.)

## v14 – Topschaatsers (17-11-2026)
- Nieuw blok **Topschaatsers** met 52 Nederlandse langebaanschaatsers: olympische medaille 2022/2026 of podium op WK, EK of wereldbeker 2021–2026.
- Toe te voegen per schaatser of per groep, met geboortemaand, dus zonder geschatte leeftijd.
- Dit is de enige lijst met namen in de pagina zelf; het gaat om publiek bekende sporters.

## v13 – Eenvoudiger zoeken (17-11-2026)
- Voorbeeldtekst bij achternaam en het veld Land verwijderd; er wordt in alle landen gezocht.

## v12 – Altijd op leeftijd (17-11-2026)
- De keuze Leeftijd/Datum is weg: de x-as is altijd de leeftijd, want daar is de tool voor.

## v11 – ANS-correctie (17-11-2026)
- Vinkje **Alleen NL-banen, ANS-gecorrigeerd**: alleen tijden op Nederlandse banen, omgerekend met de KNSB ANS-tabel (14-07-2026), zodat snelle en langzame banen eerlijk vergeleken worden.
- Extra kolom "Gereden" in het PR-verloop.

## v10 – Filter m/v (17-11-2026)
- Vinkjes **m** en **v** om jongens/mannen of meisjes/vrouwen te verbergen in grafiek en tabellen.

## v9 – Schaatsersbestanden (JSON) (17-11-2026)
- Geen namen meer in de pagina: groepen en geboortedata komen uit een JSON-bestand dat je zelf opent of erheen sleept.
- **Opslaan als JSON** bewaart de huidige selectie als zo'n bestand.

## v8 – Groepen en kleuren (17-11-2026)
- Eerste versie van groepen laden, knop **Alles wissen** en 20 lijnkleuren. (Vaste groepen in v9 vervangen door JSON-bestanden.)

## v7 – Dunnere lijnen (17-11-2026)
- Dunnere PR-lijnen en kleinere stippen, met een ruim klikgebied voor de tooltip.

## v6 – KNSB-categorienamen (17-11-2026)
- Categorieën met KNSB-namen: Pupillen A, Junioren C1, Neo-senioren 2, Senioren, Masters 40.

## v5 – Leeftijdsperiode (17-11-2026)
- Keuzelijsten **Leeftijd van … t/m …** voor grafiek en tabellen.
- "Alle gereden tijden" staat standaard uit.

## v4 – Betere leeftijdsschatting (17-11-2026)
- Zonder geboortedatum wordt de leeftijd geschat op 1 januari in het midden van de categorie.

## v3 – PR-lijn op de juiste datum (17-11-2026)
- De PR-lijn maakt de stap pas op de datum waarop het nieuwe PR is gereden.

## v2 – Geboortedatum kiezen (17-11-2026)
- Geboortemaand en -jaar via twee keuzelijsten in plaats van de onhandige maandkiezer.

## v1 – Eerste versie (17-11-2026)
- Schaatsers zoeken op naam en selecteren.
- Tijden per afstand (100 t/m 10.000 m) live van SpeedskatingResults.com.
- Grafiek met PR-verloop op leeftijd, tabellen "Beste tijd per leeftijdsjaar" en "PR-verloop".
