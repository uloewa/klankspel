# Klankspel

Een leesspel voor een kleuter, als installeerbare webapp (PWA). Vlaams, klankgericht,
groeit mee met het kind.

**Deze repo bevat alleen code.** Alles persoonlijks — ingesproken stemmen, foto's, namen en de
voortgang van het kind — blijft op het toestel zelf en komt hier nooit in.

## Stand van zaken

Skelet. Eén scherm dat toont of de app als app geopend is, of het offline-geheugen werkt en of
er verbinding is. Nog geen spel.

## Lokaal draaien

```
python3 -m http.server 8000
```

Daarna `http://localhost:8000`. Localhost telt als beveiligde context, dus de service worker
en de microfoon werken er gewoon.

## Licentie

Privéproject.
