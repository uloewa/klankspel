/* Bouwt de opnamelijst uit de gegevensbestanden — 74 stuks, in de volgorde
   waarin ze ingesproken worden. De volgorde is niet willekeurig: eerst de
   klanken (het moeilijkste, als je nog fris bent), dan woorden, dan zinnetjes. */

export async function laadLijst(basis = './data/') {
  const [klanken, woorden, zinnen] = await Promise.all([
    fetch(basis + 'klanken.json').then(r => r.json()),
    fetch(basis + 'woorden.json').then(r => r.json()),
    fetch(basis + 'aanmoedigingen.json').then(r => r.json())
  ]);

  const uit = [];

  for (const k of klanken.klanken) {
    uit.push({
      id: k.id,
      soort: 'klank',
      // enkel de korte naam boven het scherm; de uitleg staat in het gegevensbestand
      groep: (klanken.groepen[k.groep] || '').split('—')[0].trim(),
      toon: k.id,                          // groot in beeld: de letter
      zeg: k.zeg,                          // wat Thijs uitspreekt
      hint: 'als in ' + k.als_in,
      terugval: k.zeg
    });
  }

  for (const w of woorden.woorden) {
    uit.push({
      id: 'w_' + w.woord,
      soort: 'woord',
      groep: 'Woorden',
      toon: w.emoji,
      zeg: w.woord,
      hint: 'begint met de ' + w.begint_met,
      terugval: w.woord
    });
  }

  const zinGroepen = [
    ['juist',         'Als het juist is'],
    ['nog_eens',      'Als het niet juist is'],
    ['start_en_stop', 'Begin en einde']
  ];
  for (const [sleutel, naam] of zinGroepen) {
    for (const z of zinnen[sleutel] || []) {
      uit.push({
        id: z.id,
        soort: 'zin',
        groep: naam,
        toon: null,
        zeg: z.tekst,
        hint: z.wanneer || null,
        terugval: z.tekst
      });
    }
  }

  return uit;
}
