# Klankspel

Een leesspel voor een kleuter, als installeerbare webapp (PWA). Vlaams, klankgericht,
groeit mee met het kind.

**Deze repo bevat alleen code.** Alles persoonlijks — ingesproken stemmen, foto's, namen en de
voortgang van het kind — blijft op het toestel zelf en komt hier nooit in.

## Stand van zaken

Speelbaar. Na het kiezen van een figuurtje: een startmenu met **Lezen** (klanken, woorden, namen),
**Cijfers** (getal horen, evenveel sterren zien, cijfer kiezen; begint bij 1-2-3, nul als laatste) en
**Schrijven** (de namen ida, sarah en thijs bouwen uit losse letters; letters i d a t h j s r en de
cijfers 0 tot 9 schrijven met de vinger in vier niveaus). Streken: `data/schrijven.json`; cijfers:
`data/cijfers.json`. De opnamestudio (ouder.html) bevat ook de cijferwoorden en de namen.

Nog te doen: meer letters, hoofdletters, en later tekenen (konijn eerst, dan figuurtjes uit
bouwstenen). `?niveau=1..4` in het adres zet het schrijfniveau vast.

## Lokaal draaien

```
python3 -m http.server 8000
```

Daarna `http://localhost:8000`. Localhost telt als beveiligde context, dus de service worker
en de microfoon werken er gewoon.

## Licentie

Privéproject.
