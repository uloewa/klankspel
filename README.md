# Klankspel

Een leesspel voor een kleuter, als installeerbare webapp (PWA). Vlaams, klankgericht,
groeit mee met het kind.

**Deze repo bevat alleen code.** Alles persoonlijks — ingesproken stemmen, foto's, namen en de
voortgang van het kind — blijft op het toestel zelf en komt hier nooit in.

## Stand van zaken

Speelbaar. Na het kiezen van een figuurtje: een startmenu met **Lezen** (klanken, woorden, namen)
en **Schrijven** (haar naam bouwen uit losse letters, en de letters i, d, a schrijven met de
vinger in vier niveaus). De streken staan in `data/schrijven.json`.

Nog te doen: cijfers lezen (0 tot 10, met hoeveelheden), cijfers schrijven, meer letters, en later
tekenen (konijn eerst, dan figuurtjes uit bouwstenen). `?niveau=1..4` in het adres zet het
schrijfniveau vast, om elk niveau te kunnen proberen.

## Lokaal draaien

```
python3 -m http.server 8000
```

Daarna `http://localhost:8000`. Localhost telt als beveiligde context, dus de service worker
en de microfoon werken er gewoon.

## Licentie

Privéproject.
