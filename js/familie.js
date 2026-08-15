/* De familie: foto, hoe Ida die persoon noemt, en de stem van die persoon zelf.

   Ida herkent *Ida*, *Thijs Moonen* en *Sarah Vermeulen* al als woordbeeld. Dat is een
   echte eerste leesfase — ze leest de vorm, nog niet de letters. Hierop bouwt het spel
   "onze namen" verder, met mensen van wie ze houdt.

   Alles blijft op het toestel: foto's en stemmen gaan nooit naar internet, net als de
   opnames. De namen staan in localStorage, de blobs in IndexedDB. */

import { Opslag } from './opslag.js';

const SLEUTEL = 'klankspel-familie';

function lees() {
  try { return JSON.parse(localStorage.getItem(SLEUTEL) || '[]'); }
  catch { return []; }
}
function schrijf(l) {
  try { localStorage.setItem(SLEUTEL, JSON.stringify(l)); } catch {}
}

export const Familie = {
  lijst: lees,

  /* Klaar om mee te spelen = foto én stem aanwezig. Zonder stem hoort ze niets, zonder
     foto weet ze bij het begin niet wie het is. */
  speelbaar() {
    return lees().filter(p => p.heeftFoto && p.heeftStem);
  },

  async voegToe({ naam, fotoBlob, stemBlob }) {
    const id = 'f' + Date.now().toString(36);
    if (fotoBlob) await Opslag.zet('fam_' + id + '_foto', fotoBlob);
    if (stemBlob) await Opslag.zet('fam_' + id + '_stem', stemBlob);
    const l = lees();
    l.push({ id, naam: naam.trim(), heeftFoto: !!fotoBlob, heeftStem: !!stemBlob, juist: 0 });
    schrijf(l);
    return id;
  },

  async verwijder(id) {
    await Opslag.wis('fam_' + id + '_foto');
    await Opslag.wis('fam_' + id + '_stem');
    schrijf(lees().filter(p => p.id !== id));
  },

  stemId: id => 'fam_' + id + '_stem',

  async fotoUrl(id) {
    const b = await Opslag.haal('fam_' + id + '_foto');
    return b ? URL.createObjectURL(b) : null;
  },

  /* Hoe sterk moet de foto nog meehelpen? De steun verdwijnt naarmate ze de naam
     herkent — anders kijkt ze naar het gezicht en nooit naar het woord, en blijft het
     een fotospel in plaats van een leesspel. */
  fotoSterkte(p) {
    if (p.juist < 3) return 1;      // volledig zichtbaar
    if (p.juist < 6) return 0.45;   // vervaagt
    return 0;                       // weg: nu leest ze het woord
  },

  telJuist(id, raak) {
    const l = lees();
    const p = l.find(x => x.id === id);
    if (!p) return;
    // zakt ze terug, dan komt de foto weer terug helpen
    p.juist = Math.max(0, (p.juist || 0) + (raak ? 1 : -1));
    schrijf(l);
  }
};

/* Een telefoonfoto is zo 4 MB. Vierkant bijsnijden en verkleinen naar 480 px houdt het
   toestel snel en de opslag klein — meer detail heeft een portretje van ~190 px niet nodig.

   Formaat: WebP met kwaliteit 0,82, dezelfde keuze als aan de serverkant van AktivGym
   (storageOptimizeImage() in public/office/includes/storage.php). */
const WEBP_KWALITEIT = 0.82;
const JPEG_KWALITEIT  = 0.85;

function naarBlob(canvas, type, kwaliteit) {
  return new Promise(r => canvas.toBlob(r, type, kwaliteit));
}

export function verkleinFoto(bestand, maat = 480) {
  return new Promise((klaar, mis) => {
    const url = URL.createObjectURL(bestand);
    const img = new Image();
    img.onload = async () => {
      const kant = Math.min(img.width, img.height);
      const c = document.createElement('canvas');
      c.width = c.height = maat;
      const g = c.getContext('2d');
      g.drawImage(img, (img.width - kant) / 2, (img.height - kant) / 2, kant, kant, 0, 0, maat, maat);
      URL.revokeObjectURL(url);

      /* NIET WEGHALEN: canvas.toBlob valt STIL terug op PNG als de browser het gevraagde
         formaat niet kan coderen — bij Firefox is dat uitdrukkelijk gedocumenteerd gedrag.
         PNG is op een foto grofweg tien keer zo groot als WebP, dus zonder deze controle
         zou "comprimeren" het bestand juist opblazen, zonder één foutmelding.
         Daarom: vragen om WebP, en nakijken wat er terugkomt. */
      let blob = await naarBlob(c, 'image/webp', WEBP_KWALITEIT);
      if (!blob || blob.type !== 'image/webp') {
        blob = await naarBlob(c, 'image/jpeg', JPEG_KWALITEIT);
      }
      blob ? klaar(blob) : mis(new Error('kon de foto niet verwerken'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); mis(new Error('kon de foto niet lezen')); };
    img.src = url;
  });
}
