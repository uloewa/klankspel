/* Bouwt de opnamelijst uit de gegevensbestanden — 74 stuks, in de volgorde
   waarin ze ingesproken worden. De volgorde is niet willekeurig: eerst de
   klanken (het moeilijkste, als je nog fris bent), dan woorden, dan zinnetjes. */

// Pad aan de module hangen, niet aan de pagina: anders zoekt een pagina in een submap
// in haar eigen map en vindt ze de gegevens niet.
const DATA = new URL('../data/', import.meta.url);

export async function laadLijst(basis = DATA) {
  const [klanken, woorden, zinnen, cijfers, schrijven, tekenen] = await Promise.all([
    fetch(new URL('klanken.json', basis)).then(r => r.json()),
    fetch(new URL('woorden.json', basis)).then(r => r.json()),
    fetch(new URL('aanmoedigingen.json', basis)).then(r => r.json()),
    fetch(new URL('cijfers.json', basis)).then(r => r.json()),
    fetch(new URL('schrijven.json', basis)).then(r => r.json()),
    fetch(new URL('tekenen.json', basis)).then(r => r.json())
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

  for (const n of cijfers.volgorde) {
    uit.push({
      id: 'c' + n,
      soort: 'cijfer',
      groep: 'Cijfers',
      toon: String(n),
      zeg: cijfers.woorden[n],
      hint: 'het cijfer ' + n,
      terugval: cijfers.woorden[n]
    });
  }

  for (const nm of schrijven.namen) {
    uit.push({
      id: 'naam_' + nm.naam,
      soort: 'woord',
      groep: 'Namen',
      toon: nm.naam,
      zeg: nm.naam,
      hint: 'haar naam, na het bouwen',
      terugval: nm.naam
    });
  }

  /* De aanwijzingen bij het tekenen: elke stap een zinnetje, ook voor elke ooropstelling. */
  for (const [fid, f] of Object.entries(tekenen.figuren)) {
    const stappen = [...f.stappen.filter(x => x.zeg), ...Object.values(f.oren).flat()];
    for (const st of stappen) {
      uit.push({
        id: st.id,
        soort: 'zin',
        groep: 'Tekenen: ' + f.titel,
        toon: null,
        zeg: st.zeg,
        hint: st.wat,
        terugval: st.zeg
      });
    }
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
