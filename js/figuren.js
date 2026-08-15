/* De figuurtjes waaruit Ida kiest.

   Eén lichaam, verschillende verkleedstukken. Dat is niet alleen zuinig: doordat ze
   dezelfde mond en dezelfde klassen delen, kunnen ze ALLEMAAL blij en nieuwsgierig
   kijken. Het figuurtje is het enige kanaal waarlangs Ida feedback krijgt zonder te
   kunnen lezen — een figuur dat niet reageert hoort hier niet.

   Geen nagemaakte Disney- of Paw Patrol-figuren: die zijn beschermd en deze repo is
   publiek. Dit zijn eigen archetypes die ze wél herkent. */

const DATA = new URL('../data/figuren.json', import.meta.url);

const OOG = '#3B2C22';
const SCHADUW = '#E0D2BB';

/* De drie monden. Nooit een neerwaartse: er valt in deze app niets te verliezen. */
export const MONDEN = {
  rustig: 'M48 74 Q60 80 72 74',
  blij:   'M44 70 Q60 88 76 70',
  kijkt:  'M54 72 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0'
};

/* Verkleedstukken. Alles blijft binnen de viewBox 0 0 120 110, zodat elke maatvoering
   in de CSS blijft kloppen ongeacht wie er staat. */
const ONDERDELEN = {
  /* Achter het hoofd. Let op: het hoofd is een cirkel met straal 42 op (60,58) — haar
     dat daarbinnen valt is onzichtbaar. Deze vormen steken er dus bewust buiten uit,
     zodat het gezicht omlijst wordt in plaats van bedekt. */
  haar: f => `<ellipse cx="60" cy="58" rx="51" ry="49" fill="${f.haar}"/>
              <ellipse cx="22" cy="80" rx="12" ry="22" fill="${f.haar}"/>
              <ellipse cx="98" cy="80" rx="12" ry="22" fill="${f.haar}"/>`,
  manen: f => `<ellipse cx="60" cy="56" rx="49" ry="47" fill="${f.haar}"/>
               <path d="M60 8 q14 6 10 18 q10 -2 12 10 q10 4 6 16" fill="none"
                     stroke="${f.haar}" stroke-width="9" stroke-linecap="round"/>`,
  oren: f => `<circle cx="24" cy="34" r="10" fill="${f.huid}"/><circle cx="96" cy="34" r="10" fill="${f.huid}"/>`,
  flaporen: f => `<ellipse cx="17" cy="66" rx="11" ry="21" fill="${f.diep}"/>
                  <ellipse cx="103" cy="66" rx="11" ry="21" fill="${f.diep}"/>`,

  // bovenop het hoofd (na het gezicht)
  kroon: () => `<path d="M40 22 L47 8 L54 18 L60 4 L66 18 L73 8 L80 22Z" fill="#E8B84B"/>
                <rect x="40" y="21" width="40" height="7" rx="3" fill="#E8B84B"/>
                <circle cx="60" cy="12" r="3.2" fill="#C9483F"/>`,
  /* Geen vinkje op de helm: dat lijkt te veel op het "goed"-teken uit het spel.
     Een pootafdruk kan die verwarring niet geven. */
  helm: f => `<path d="M20 40 A40 40 0 0 1 100 40 L100 44 L20 44Z" fill="${f.helm}"/>
              <rect x="14" y="40" width="92" height="9" rx="4.5" fill="${f.helm}"/>
              <circle cx="60" cy="26" r="9" fill="#FFF6E8"/>
              <ellipse cx="60" cy="29" rx="4" ry="3.2" fill="${f.helm}"/>
              <circle cx="55" cy="23" r="1.7" fill="${f.helm}"/><circle cx="60" cy="21.5" r="1.7" fill="${f.helm}"/>
              <circle cx="65" cy="23" r="1.7" fill="${f.helm}"/>`,
  // wit op lichtblauw verdwijnt; deze blauw is donker genoeg om te zien
  sneeuwvlok: () => `<g stroke="#3E7FA8" stroke-width="3.6" stroke-linecap="round">
                <path d="M60 2 v24 M49 6 l22 16 M71 6 l-22 16"/>
                <path d="M60 9 l-5 -5 M60 9 l5 -5"/></g>
                <circle cx="60" cy="25" r="3.4" fill="#3E7FA8"/>`,
  schelp: () => `<path d="M44 26 Q60 2 76 26 Z" fill="#F2A0B4"/>
                 <g stroke="#D4788E" stroke-width="2" fill="none">
                 <path d="M60 26 V6"/><path d="M52 26 Q56 12 58 7"/><path d="M68 26 Q64 12 62 7"/></g>`,
  hoorn: () => `<path d="M60 2 L67 26 L53 26 Z" fill="#E8B84B"/>
                <g stroke="#C99B33" stroke-width="2" stroke-linecap="round">
                <path d="M56 20 h8"/><path d="M57 14 h6"/></g>`
};

const ACHTER = ['haar', 'manen', 'oren', 'flaporen'];

let _lijst = null;

export async function laadFiguren() {
  if (_lijst) return _lijst;
  _lijst = (await fetch(DATA).then(r => r.json())).figuren;
  return _lijst;
}

export function figuur(id) {
  return (_lijst || []).find(f => f.id === id) || (_lijst || [])[0];
}

/* Bouwt de SVG. mond = 'rustig' | 'blij' | 'kijkt'. */
export function tekenFiguur(id, { mond = 'rustig', klas = 'vriendje', idAttr = '' } = {}) {
  const f = figuur(id);
  if (!f) return '';
  const stukken = f.onderdelen || [];
  const achter = stukken.filter(o => ACHTER.includes(o));
  const voor   = stukken.filter(o => !ACHTER.includes(o));
  const teken  = naam => (ONDERDELEN[naam] ? ONDERDELEN[naam](f) : '');

  return `<svg viewBox="0 0 120 110" class="${klas}"${idAttr ? ` id="${idAttr}"` : ''} aria-hidden="true">
    <ellipse cx="60" cy="102" rx="34" ry="6" fill="${SCHADUW}"/>
    ${achter.map(teken).join('')}
    <circle cx="60" cy="58" r="42" fill="${f.huid}"/>
    <circle cx="46" cy="52" r="7" fill="${OOG}"/>
    <circle cx="74" cy="52" r="7" fill="${OOG}"/>
    <path class="mond" d="${MONDEN[mond] || MONDEN.rustig}" stroke="${OOG}" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${voor.map(teken).join('')}
  </svg>`;
}

/* Wie speelde er de vorige keer mee? Blijft bewaard, zodat haar keuze niet elke dag
   opnieuw gemaakt moet worden. */
const SLEUTEL = 'klankspel-figuur';
export const Gekozen = {
  lees()  { try { return localStorage.getItem(SLEUTEL); } catch { return null; } },
  zet(id) { try { localStorage.setItem(SLEUTEL, id); } catch {} }
};
