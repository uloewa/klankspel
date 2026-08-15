/* De meegroei-motor.

   Houdt per letter apart bij hoe sterk Ida die kent, kiest wat er nu aan de beurt is,
   en stuurt de moeilijkheid bij naar ongeveer 85% juist — de zone waarin leren het
   snelst gaat. Alle drempels staan in data/motor.json, niet hier.

   Wat deze motor NIET doet: oordelen. Hij kan niet zien of een fout betekent "ze kent
   het niet", "ze tikte mis" of "haar neefje speelde even mee". Daarom telt een eerste
   fout op een letter niet mee, en tellen tikken die te snel komen helemaal niet. In het
   ouderscherm staat wat de motor dénkt, met een knop om dat te overrulen. */

const SLEUTEL = 'klankspel-motor';

/* Pad aan de MODULE hangen, niet aan de pagina. Met './data/…' zoekt een pagina in een
   submap (zoals tools/simulatie.html) in haar eigen map en vindt niets. */
const DATA = new URL('../data/', import.meta.url);

let cfg = null;          // data/motor.json
let alle = [];           // alle letters in leervolgorde: [{id, klank}]
let st = null;           // de toestand die bewaard blijft
let profiel = 'ida';     // 'ida' of 'gast' — gast schrijft NIETS weg

function leegState(startAantal, keuzes) {
  const actief = alle.slice(0, startAantal).map(l => l.id);
  const letters = {};
  for (const id of actief) letters[id] = { sterkte: 0, laatst: -99, juist: 0, fout: 0, foutSessie: 0 };
  return {
    actief, letters, keuzes,
    beurt: 0,
    historie: [],          // 1 = juist, 0 = fout, alleen meegetelde antwoorden
    juistOpRij: 0,
    foutOpRij: 0,
    verwarrend: false,     // pas aan als keuzes al op max staan
    verveelRem: 0,         // hoe vaak de verveelrem afging deze sessie
    vorigDoel: null
  };
}

function bewaar() {
  if (profiel !== 'ida') return;              // een gast laat geen sporen na
  try { localStorage.setItem(SLEUTEL, JSON.stringify(st)); } catch {}
}

function treffers() {
  const v = st.historie.slice(-cfg.mikpunt.venster);
  if (v.length < Math.min(6, cfg.mikpunt.venster)) return null;   // te weinig om iets te vinden
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function lijktOpElkaar(a, b) {
  return cfg.lijkt_op_elkaar.some(p => (p[0] === a && p[1] === b) || (p[1] === a && p[0] === b));
}

function stevige() {
  return st.actief.filter(id => st.letters[id].sterkte >= cfg.letters.stevig_vanaf).length;
}

function letterErbij() {
  if (st.actief.length >= cfg.letters.max_actief) return false;
  const volgende = alle.find(l => !st.actief.includes(l.id));
  if (!volgende) return false;
  st.actief.push(volgende.id);
  st.letters[volgende.id] = { sterkte: 0, laatst: -99, juist: 0, fout: 0, foutSessie: 0 };
  return volgende.id;
}

/* Moeilijker in kleine stappen, in deze volgorde. Nooit met een schok:
   meer keuzes -> afleiders die op elkaar lijken -> pas dan een nieuwe letter. */
function moeilijker() {
  if (st.keuzes < Math.min(cfg.keuzes.max, st.actief.length)) { st.keuzes++; return 'keuzes'; }
  if (!st.verwarrend) { st.verwarrend = true; return 'verwarrend'; }
  if (stevige() >= cfg.letters.nieuwe_letter_na_stevig) {
    const nieuw = letterErbij();
    if (nieuw) return 'letter:' + nieuw;
  }
  return null;
}

/* Makkelijker, in omgekeerde volgorde. De laatste stap — een letter parkeren — is er
   omdat de motor anders vastzat: op 2 keuzes was er geen weg omlaag meer en bleef hij
   vragen stellen die ze niet aankon (gemeten in de simulatie: 63%, ruim onder het
   mikpunt). Parkeren neemt alleen last weg bij een letter die ze nog NIET kent; ze
   merkt er niets van en de letter komt later gewoon terug. */
function makkelijker() {
  if (st.verwarrend) { st.verwarrend = false; return 'verwarrend-uit'; }
  if (st.keuzes > cfg.keuzes.min) { st.keuzes--; return 'keuzes'; }

  if (st.actief.length > cfg.letters.min_actief) {
    const zwakste = [...st.actief].sort((a, b) => st.letters[a].sterkte - st.letters[b].sterkte)[0];
    if (st.letters[zwakste].sterkte < cfg.letters.stevig_vanaf) {
      st.actief = st.actief.filter(id => id !== zwakste);
      if (st.vorigDoel === zwakste) st.vorigDoel = null;
      return 'geparkeerd:' + zwakste;
    }
  }
  return null;
}

export const Motor = {
  async laad(letters, { profiel: p = 'ida', gastSoort = null } = {}) {
    cfg = await fetch(new URL('motor.json', DATA)).then(r => r.json());
    alle = letters;
    profiel = p;

    if (p === 'gast') {
      const g = cfg.gast[gastSoort] || cfg.gast.even_oud;
      st = leegState(Math.min(g.aantal_letters, alle.length), g.keuzes);
      return st;
    }

    let bewaard = null;
    try { bewaard = JSON.parse(localStorage.getItem(SLEUTEL)); } catch {}
    st = bewaard && bewaard.letters ? bewaard : leegState(4, cfg.keuzes.min);

    // nieuwe sessie: de per-sessie tellers schoon
    st.verveelRem = 0;
    st.foutOpRij = 0;
    st.juistOpRij = 0;
    for (const id of st.actief) if (st.letters[id]) st.letters[id].foutSessie = 0;
    bewaar();
    return st;
  },

  /* Wat is er nu aan de beurt? Zwaarder wegen: wat ze minder goed kent, en wat het
     langst geleden aan bod kwam. Nooit twee keer na elkaar dezelfde vraag. */
  volgende() {
    st.beurt++;
    const kandidaten = st.actief.filter(id => id !== st.vorigDoel);
    const pool = kandidaten.length ? kandidaten : st.actief;

    const gewicht = id => {
      const l = st.letters[id];
      const zwakte = (cfg.letters.sterkte_max - l.sterkte) + 1;
      const wachttijd = Math.min(5, st.beurt - l.laatst);
      return zwakte * 2 + wachttijd;
    };
    const totaal = pool.reduce((s, id) => s + gewicht(id), 0);
    let trek = Math.random() * totaal, doel = pool[pool.length - 1];
    for (const id of pool) { trek -= gewicht(id); if (trek <= 0) { doel = id; break; } }

    st.vorigDoel = doel;
    st.letters[doel].laatst = st.beurt;
    return { doel, opties: this.opties(doel, st.keuzes), herhaling: false };
  },

  /* Een vraag die ergens anders is samengesteld (zoals een woordronde) toch bij de motor
     aanmelden. Zonder dit weet hij niet dat die letter net aan bod kwam: hij kan hem
     meteen daarna nog eens stellen, en zijn "wat heb ik lang niet gezien"-weging klopt niet. */
  markeer(doel) {
    st.beurt++;
    st.vorigDoel = doel;
    if (st.letters[doel]) st.letters[doel].laatst = st.beurt;
  },

  /* De afleiders. Staat 'verwarrend' uit, dan juist letters die er zo min mogelijk op
     lijken — anders raadt ze op vorm in plaats van op klank. */
  opties(doel, hoeveel) {
    const rest = st.actief.filter(id => id !== doel);
    const gesorteerd = [...rest].sort((a, b) => {
      const sa = lijktOpElkaar(doel, a) ? 1 : 0;
      const sb = lijktOpElkaar(doel, b) ? 1 : 0;
      return st.verwarrend ? sb - sa : sa - sb;
    });
    const gekozen = gesorteerd.slice(0, Math.max(0, hoeveel - 1));
    return [doel, ...gekozen].sort(() => Math.random() - .5);
  },

  /* Een makkelijkere herhaling van dezelfde vraag, meteen na een fout: twee keuzes en
     een afleider die er zo min mogelijk op lijkt. Onderzoek naar herhaald ophalen bij
     kleuters wijst aan dat een mislukte poging pas helpt als ze er kort daarna wél in
     slaagt. Deze beurt telt niet mee in de meting. */
  herhaal(doel) {
    const rest = st.actief.filter(id => id !== doel);
    const verst = rest.sort((a, b) => (lijktOpElkaar(doel, a) ? 1 : 0) - (lijktOpElkaar(doel, b) ? 1 : 0))[0];
    return { doel, opties: [doel, verst].filter(Boolean).sort(() => Math.random() - .5), herhaling: true };
  },

  /* Verwerkt een antwoord en zegt wat er verandert.
     reactieMs = tijd tussen de vraag en haar tik. */
  antwoord(doel, gekozen, reactieMs, wasHerhaling = false) {
    const juist = doel === gekozen;
    const l = st.letters[doel];
    const teSnel = reactieMs != null && reactieMs < cfg.ruis.te_snel_ms;
    const uit = { juist, teltMee: !teSnel && !wasHerhaling, aanpassing: null, nieuweLetter: null,
                  verveeld: false, gefrustreerd: false, magAfronden: false };

    if (juist) {
      st.juistOpRij++; st.foutOpRij = 0;
      if (uit.teltMee) {
        l.juist++;
        l.sterkte = Math.min(cfg.letters.sterkte_max, l.sterkte + 1);
        st.historie.push(1);
      }
    } else {
      st.foutOpRij++; st.juistOpRij = 0;
      if (uit.teltMee) {
        l.fout++; l.foutSessie++;
        // een eerste misser telt niet: een 4-jarige tikt ook gewoon naast
        if (l.foutSessie >= cfg.ruis.fouten_voor_daling) l.sterkte = Math.max(0, l.sterkte - 1);
        st.historie.push(0);
      }
      if (st.foutOpRij >= cfg.remmen.frustratie_fouten_op_rij) {
        uit.gefrustreerd = true;
        st.foutOpRij = 0;
        makkelijker();
      }
    }

    /* Verveelrem: te lang foutloos = te makkelijk. Maar een reeks telt ALLEEN als ze het
       ook in het algemeen goed doet — met twee keuzes haal je zes op rij door te gokken.
       Zonder die eis duwde deze rem de moeilijkheid omhoog terwijl ze worstelde, en
       botste hij met de frustratierem. */
    const t0 = treffers();
    const echtVerveeld = st.juistOpRij >= cfg.remmen.verveling_juist_op_rij
      && (t0 === null || t0 >= cfg.remmen.verveling_vereist_treffers);

    if (st.juistOpRij >= cfg.remmen.verveling_juist_op_rij && !echtVerveeld) {
      st.juistOpRij = 0;                       // geluk, geen verveling: alleen de teller terug
    } else if (echtVerveeld) {
      st.juistOpRij = 0;
      st.verveelRem++;
      uit.verveeld = true;
      uit.aanpassing = moeilijker();
      if (st.verveelRem >= cfg.remmen.afronden_na_verveelrem) uit.magAfronden = true;
    } else if (uit.teltMee) {
      const t = treffers();
      if (t !== null) {
        if (t > cfg.mikpunt.moeilijker_boven) uit.aanpassing = moeilijker();
        else if (t < cfg.mikpunt.makkelijker_onder) uit.aanpassing = makkelijker();
      }
    }

    if (uit.aanpassing && uit.aanpassing.startsWith('letter:')) uit.nieuweLetter = uit.aanpassing.slice(7);
    bewaar();
    return uit;
  },

  sessieMs: () => (cfg.sessie.duur_minuten * 60 * 1000),
  toestand: () => JSON.parse(JSON.stringify(st)),
  config:   () => cfg,

  /* Voor het ouderscherm: wat denkt de motor dat ze kent? */
  overzicht() {
    return st.actief.map(id => ({
      letter: id,
      sterkte: st.letters[id].sterkte,
      juist: st.letters[id].juist,
      fout: st.letters[id].fout,
      stevig: st.letters[id].sterkte >= cfg.letters.stevig_vanaf
    }));
  },

  zetSterkte(id, sterkte) {
    if (!st.letters[id]) return;
    st.letters[id].sterkte = Math.max(0, Math.min(cfg.letters.sterkte_max, sterkte));
    bewaar();
  },

  wis() { try { localStorage.removeItem(SLEUTEL); } catch {} }
};
