/* De geluidslaag. Overal in de app gaat geluid hier doorheen.

   Voorrang: papa's opname > Vlaamse computerstem > Nederlandse computerstem > stilte.
   Nooit crashen op een ontbrekend geluid — een kind van vier merkt een stille knop
   wel, maar een kapot scherm is erger.

   Waarom nadrukkelijk nl-BE eerst: Android kiest voor Nederlands standaard een
   nl-NL-stem, en dat is precies het accent dat hier niet hoort. Zodra de opnames
   erin zitten is het punt weg — dan hoort Ida enkel nog haar papa. */

import { Opslag } from './opslag.js';

let _stem = null;
let _metOpname = new Set();
let _nu = null;          // huidige audio, zodat we hem kunnen afbreken
let _laatsteUrl = null;

function kiesStem() {
  const alle = speechSynthesis.getVoices();
  _stem = alle.find(v => v.lang === 'nl-BE')
       || alle.find(v => v.lang && v.lang.replace('_', '-').startsWith('nl'))
       || null;
}
kiesStem();
if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = kiesStem;

export const Zeg = {
  /* Eén keer bij het opstarten: welke opnames bestaan er? Zo hoeft een tik
     tijdens het spel niet op de database te wachten. */
  async laad() {
    _metOpname = new Set(await Opslag.ids());
    return _metOpname.size;
  },

  heeftOpname(id) { return _metOpname.has(id); },
  aantalOpnames()  { return _metOpname.size; },

  vergeet(id) { _metOpname.delete(id); },
  onthoud(id) { _metOpname.add(id); },

  stop() {
    if (_nu) { _nu.pause(); _nu = null; }
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (_laatsteUrl) { URL.revokeObjectURL(_laatsteUrl); _laatsteUrl = null; }
  },

  /* id       = sleutel van de opname (bv. 'm', 'w_maan', 'j1')
     terugval = wat de computerstem moet zeggen als er geen opname is
     wacht    = pas terugkeren als het geluid echt is afgelopen. Nodig waar iets
                ná het geluid moet gebeuren (doorspringen in de opnamestudio);
                een vaste wachttijd kapt een langer zinnetje halverwege af. */
  async zeg(id, terugval, { wacht = false } = {}) {
    this.stop();

    if (_metOpname.has(id)) {
      const blob = await Opslag.haal(id);
      if (blob) {
        _laatsteUrl = URL.createObjectURL(blob);
        _nu = new Audio(_laatsteUrl);
        try {
          const klaar = wacht
            ? new Promise(r => { _nu.onended = r; _nu.onerror = r; })
            : null;
          await _nu.play();
          if (klaar) await klaar;
          return 'opname';
        } catch { /* val door naar de computerstem */ }
      }
    }

    if (!terugval || typeof speechSynthesis === 'undefined') return 'stil';
    const u = new SpeechSynthesisUtterance(terugval);
    u.lang = 'nl-BE';
    u.rate = 0.7;
    if (_stem) u.voice = _stem;
    speechSynthesis.speak(u);
    return _stem && _stem.lang === 'nl-BE' ? 'stem-be' : 'stem-anders';
  },

  /* Voor het ouderscherm: klopt de stem op dit toestel? */
  stemInfo() {
    return _stem
      ? { naam: _stem.name, taal: _stem.lang, vlaams: _stem.lang === 'nl-BE' }
      : { naam: null, taal: null, vlaams: false };
  }
};
