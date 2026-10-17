# Klankspel

Een leesspel voor een kleuter, als installeerbare webapp (PWA). Vlaams, klankgericht,
groeit mee met het kind.

**Deze repo bevat alleen code.** Alles persoonlijks — ingesproken stemmen, foto's, namen en de
voortgang van het kind — blijft op het toestel zelf en komt hier nooit in.

## Stand van zaken

Speelbaar. Na het kiezen van een figuurtje: een startmenu met **Lezen** (klanken, woorden, namen),
**Cijfers** (getal horen, evenveel sterren zien, cijfer kiezen; begint bij 1-2-3, nul als laatste) en
**Schrijven** (de namen ida, sarah en thijs bouwen uit losse letters; letters i d a t h j s r, de
hoofdletters I D A T H J S R en de cijfers 0 tot 9 schrijven met de vinger in vier niveaus). Streken: `data/schrijven.json`; cijfers:
`data/cijfers.json`. De opnamestudio (ouder.html) bevat ook de cijferwoorden en de namen.

**Tekenen**: zon, konijn, huisje, boom, vis, egel, poes, muis, auto, mannetje en vlinder (egel met stekels als streepjes, zoals het cijfer 1). Het konijn stap voor stap (hoofd, oren naar keuze van Ida: een lang + een slap, twee lange
of twee slappe; gezicht, lijf, pootjes, staart) in vier hulpniveaus, daarna inkleuren (tik een vlak,
6 kleuren) en **vrij tekenen** (kleuren, laatste streek weg, alles weg). Figuren staan in
`data/tekenen.json`; een nieuwe figuur toevoegen = daar een blok bijzetten.
De aanwijzingen ("Eerst het hoofd...") staan ook in de opnamestudio.

Nog te doen: meer figuren (slak, zwaan, boot...), meer letters. `?niveau=1..4` in het
adres zet het hulpniveau van schrijven en tekenen vast.

## Lokaal draaien

```
python3 -m http.server 8000
```

Daarna `http://localhost:8000`. Localhost telt als beveiligde context, dus de service worker
en de microfoon werken er gewoon.

## Licentie

Privéproject.
