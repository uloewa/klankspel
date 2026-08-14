/* Opslag — alles wat van Ida en het gezin is, blijft op dit toestel.
   Opnames als blob in IndexedDB, instellingen in localStorage.
   Er gaat niets naar internet. Dat is geen implementatiedetail maar de afspraak. */

const DB_NAAM = 'klankspel';
const DB_VERSIE = 1;
const WINKEL = 'opnames';

let _db = null;

function open() {
  if (_db) return Promise.resolve(_db);
  return new Promise((klaar, mis) => {
    const v = indexedDB.open(DB_NAAM, DB_VERSIE);
    v.onupgradeneeded = () => {
      const db = v.result;
      if (!db.objectStoreNames.contains(WINKEL)) db.createObjectStore(WINKEL);
    };
    v.onsuccess = () => { _db = v.result; klaar(_db); };
    v.onerror = () => mis(v.error);
  });
}

function doe(modus, werk) {
  return open().then(db => new Promise((klaar, mis) => {
    const t = db.transaction(WINKEL, modus);
    const w = t.objectStore(WINKEL);
    const v = werk(w);
    t.oncomplete = () => klaar(v && 'result' in v ? v.result : undefined);
    t.onerror = () => mis(t.error);
    t.onabort = () => mis(t.error);
  }));
}

export const Opslag = {
  zet:  (id, blob) => doe('readwrite', w => w.put(blob, id)),
  haal: (id)       => doe('readonly',  w => w.get(id)),
  wis:  (id)       => doe('readwrite', w => w.delete(id)),
  ids:  ()         => doe('readonly',  w => w.getAllKeys()),

  async alles() {
    const ids = await this.ids();
    const uit = {};
    for (const id of ids) uit[id] = await this.haal(id);
    return uit;
  },

  /* Reservekopie. Verliezen betekent 40 minuten opnieuw inspreken, dus dit moet
     eenvoudig genoeg zijn dat het ook echt gebeurt: één bestand, één knop. */
  async naarBestand() {
    const alles = await this.alles();
    const pak = { soort: 'klankspel-stempak', versie: 1, opnames: {} };
    for (const [id, blob] of Object.entries(alles)) {
      pak.opnames[id] = { type: blob.type, data: await blobNaarBase64(blob) };
    }
    return new Blob([JSON.stringify(pak)], { type: 'application/json' });
  },

  async uitBestand(bestand) {
    const pak = JSON.parse(await bestand.text());
    if (pak.soort !== 'klankspel-stempak') throw new Error('Dit is geen stempak van Klankspel.');
    let n = 0;
    for (const [id, o] of Object.entries(pak.opnames || {})) {
      await this.zet(id, base64NaarBlob(o.data, o.type));
      n++;
    }
    return n;
  }
};

function blobNaarBase64(blob) {
  return new Promise((klaar, mis) => {
    const l = new FileReader();
    l.onload = () => klaar(String(l.result).split(',')[1]);
    l.onerror = () => mis(l.error);
    l.readAsDataURL(blob);
  });
}

function base64NaarBlob(b64, type) {
  const ruw = atob(b64);
  const bytes = new Uint8Array(ruw.length);
  for (let i = 0; i < ruw.length; i++) bytes[i] = ruw.charCodeAt(i);
  return new Blob([bytes], { type: type || 'audio/webm' });
}
