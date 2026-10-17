/* De cijfermotor: welk cijfer is aan de beurt en hoeveel keuzes zijn er?

   Klein en bewust simpel. Ze begint met de eerste drie cijfers uit data/cijfers.json; heeft ze er
   'ontgrendel_na' op rij goed, dan komt er een cijfer bij. Een fout zet de reeks terug op nul
   maar haalt geen cijfer weg: er valt niets te verliezen, ze krijgt alleen meer oefening.

   Alles blijft op het toestel. */

const SLEUTEL = 'klankspel-cijfers';

let cfg = null;
let st = { actief: 0, rij: 0 };

function lees() {
  try { return JSON.parse(localStorage.getItem(SLEUTEL) || 'null'); } catch { return null; }
}
function schrijf() { try { localStorage.setItem(SLEUTEL, JSON.stringify(st)); } catch {} }

const kies = lijst => lijst[Math.floor(Math.random() * lijst.length)];

export const Cijfers = {
  laad(config) {
    cfg = config;
    const o = lees();
    st = { actief: Math.max(cfg.start_aantal, Math.min(cfg.volgorde.length, o?.actief || 0)), rij: 0 };
  },

  woord: n => cfg.woorden[n],
  actief: () => cfg.volgorde.slice(0, st.actief),

  /* Het nieuwste cijfer krijgt de meeste beurten: dat is het enige dat ze nog niet kent. */
  volgende(vorige = null) {
    const act = this.actief();
    const kans = act.flatMap((n, i) => Array(i === act.length - 1 ? 3 : 1).fill(n)).filter(n => n !== vorige);
    return this.vraag(kies(kans.length ? kans : act), act.length >= cfg.drie_keuzes_vanaf ? 3 : 2);
  },

  herhaal(doel) { return this.vraag(doel, 2); },     // na een fout: makkelijker gemaakt

  vraag(doel, aantal) {
    const andere = this.actief().filter(n => n !== doel).sort(() => Math.random() - .5);
    const opties = [doel, ...andere.slice(0, aantal - 1)].sort(() => Math.random() - .5);
    return { doel, opties };
  },

  antwoord(doel, gekozen, { bewaar = true } = {}) {
    const juist = doel === gekozen;
    let nieuw = false;
    if (!bewaar) return { juist, nieuw };
    if (!juist) st.rij = 0;
    else if (++st.rij >= cfg.ontgrendel_na && st.actief < cfg.volgorde.length) {
      st.actief++; st.rij = 0; nieuw = true;
    }
    schrijf();
    return { juist, nieuw };
  }
};
