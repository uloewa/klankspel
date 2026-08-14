/* Een klein logboek op het toestel. Niet om Ida te beoordelen, maar om na twee weken
   te kunnen zien wat ze werkelijk deed — waar ze afhaakt, welke letters blijven hangen.
   Zonder dat kunnen we niets bijsturen, en dan is de app een gok die blijft staan.

   Blijft op het toestel. Thijs haalt het er met één knop uit. */

const SLEUTEL = 'klankspel-log';
const MAX = 4000;   // ruim genoeg voor maanden; daarna vallen de oudste weg

function lees() {
  try { return JSON.parse(localStorage.getItem(SLEUTEL) || '[]'); }
  catch { return []; }
}

function schrijf(rijen) {
  try { localStorage.setItem(SLEUTEL, JSON.stringify(rijen.slice(-MAX))); }
  catch { /* opslag vol of geweigerd: het spel gaat gewoon door */ }
}

export const Log = {
  /* soort: 'start' | 'juist' | 'fout' | 'muur' | 'einde' | 'stop'
     bij een antwoord: letter = de gevraagde klank, gekozen = wat ze tikte */
  boek(soort, extra = {}) {
    const rijen = lees();
    rijen.push({ t: Date.now(), soort, ...extra });
    schrijf(rijen);
  },

  alles: lees,
  aantal: () => lees().length,
  wis() { try { localStorage.removeItem(SLEUTEL); } catch {} },

  /* Ruwe regels zijn voor mij; dit is wat Thijs wil zien. */
  samenvatting() {
    const r = lees();
    const antw = r.filter(x => x.soort === 'juist' || x.soort === 'fout');
    const juist = antw.filter(x => x.soort === 'juist').length;
    const sessies = r.filter(x => x.soort === 'start').length;

    const perLetter = {};
    for (const a of antw) {
      const l = a.letter;
      if (!l) continue;
      perLetter[l] = perLetter[l] || { juist: 0, fout: 0 };
      perLetter[l][a.soort === 'juist' ? 'juist' : 'fout']++;
    }

    return {
      sessies,
      antwoorden: antw.length,
      juistPercent: antw.length ? Math.round(juist / antw.length * 100) : null,
      perLetter,
      afgehaakt: r.filter(x => x.soort === 'stop').length,
      uitgespeeld: r.filter(x => x.soort === 'einde').length
    };
  }
};
