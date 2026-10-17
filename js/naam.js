/* Naam bouwen: de letters van een naam staan door elkaar, en ze legt ze in de goede volgorde.

   Sleep of tik: sleep een letter naar een vakje, of tik een letter en dan een vakje. Slepen
   alleen zou voor wie het scherm kwijtraakt onder de vinger niet lukken, dus beide kan.

   NOOIT "fout": een letter die op de verkeerde plek valt, glijdt zacht terug. Een letter die
   goed zit, blijft staan en klinkt. Het doel is ruim: bij de buurt van het vakje loslaten is
   genoeg. */

const schudden = n => {
  const v = [...Array(n).keys()];
  if (n < 2) return v;
  do { v.sort(() => Math.random() - .5); } while (v.every((x, i) => x === i));
  return v;
};

function maak(klas, tekst) {
  const d = document.createElement('div');
  d.className = klas;
  if (tekst != null) d.textContent = tekst;
  return d;
}

export function naamBouwer(host, { letters, onPlaats = () => {}, onNaast = () => {}, onKlaar = () => {} }) {
  host.innerHTML = '';
  const plekken = maak('naam-plekken'), tegels = maak('naam-tegels');
  host.append(plekken, tegels);
  letters.forEach(() => plekken.append(maak('naam-plek')));

  let gekozen = null, geplaatst = 0, gestopt = false;
  const vensters = [];

  /* Waar moet de tegel heen, als hij nu op (x, y) verschoven staat? Zijn rustplek volgt uit
     de huidige plaats min zijn verschuiving. */
  function naar(t, slot) {
    const x = +t.dataset.x, y = +t.dataset.y;
    const r = t.getBoundingClientRect(), q = slot.getBoundingClientRect();
    return [x + (q.left + q.width / 2) - (r.left + r.width / 2), y + (q.top + q.height / 2) - (r.top + r.height / 2)];
  }
  function zet(t, x, y) { t.dataset.x = x; t.dataset.y = y; t.style.transform = `translate(${x}px,${y}px)`; }
  function terug(t) { t.classList.add('terug'); zet(t, 0, 0); onNaast(t.dataset.l); }

  function probeer(t, i) {
    if (letters[i] !== t.dataset.l) return terug(t);
    t.classList.add('terug', 'klaar');
    t.dataset.slot = i;
    zet(t, ...naar(t, plekken.children[i]));
    plekken.children[i].classList.add('vol');
    gekozen = null;
    [...tegels.children].forEach(x => x.classList.remove('keuze'));
    geplaatst++;
    onPlaats(t.dataset.l, i);
    if (geplaatst === letters.length) onKlaar();
  }

  function slotBij(t) {
    const r = t.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = -1, bd = Infinity;
    [...plekken.children].forEach((p, i) => {
      if (p.classList.contains('vol')) return;
      const q = p.getBoundingClientRect();
      const d = Math.hypot(cx - (q.left + q.width / 2), cy - (q.top + q.height / 2));
      if (d < bd) { bd = d; best = i; }
    });
    const breed = plekken.children[0].getBoundingClientRect().width;
    return bd < breed * 1.1 ? best : -1;
  }

  schudden(letters.length).forEach(n => {
    const t = maak('naam-tegel', letters[n]);
    t.dataset.l = letters[n]; t.dataset.x = 0; t.dataset.y = 0;
    let begin = null, bewogen = false;

    t.addEventListener('pointerdown', e => {
      if (gestopt || t.classList.contains('klaar') || begin) return;
      e.preventDefault();
      try { t.setPointerCapture(e.pointerId); } catch {}
      begin = { x: e.clientX, y: e.clientY, tx: +t.dataset.x, ty: +t.dataset.y, id: e.pointerId };
      bewogen = false;
      t.classList.remove('terug'); t.classList.add('sleep');
    });
    t.addEventListener('pointermove', e => {
      if (!begin || e.pointerId !== begin.id) return;
      const dx = e.clientX - begin.x, dy = e.clientY - begin.y;
      if (Math.abs(dx) + Math.abs(dy) > 8) bewogen = true;
      zet(t, begin.tx + dx, begin.ty + dy);
    });
    const los = e => {
      if (!begin || e.pointerId !== begin.id) return;
      begin = null; t.classList.remove('sleep');
      if (!bewogen) {                      // gewoon getikt: kiezen of weer loslaten
        zet(t, 0, 0);
        gekozen = gekozen === t ? null : t;
        [...tegels.children].forEach(x => x.classList.toggle('keuze', x === gekozen));
        return;
      }
      const i = slotBij(t);
      if (i >= 0) probeer(t, i); else terug(t);
    };
    t.addEventListener('pointerup', los);
    t.addEventListener('pointercancel', los);
    tegels.append(t);
  });

  plekken.addEventListener('click', e => {
    const p = e.target.closest('.naam-plek');
    if (gestopt || !p || !gekozen || p.classList.contains('vol')) return;
    probeer(gekozen, [...plekken.children].indexOf(p));
  });

  /* Tablet gedraaid? Dan staan de vakjes ergens anders en moeten de gelegde letters mee. */
  const opnieuw = () => [...tegels.children].forEach(t => {
    if (!t.classList.contains('klaar')) return;
    t.classList.remove('terug');
    zet(t, ...naar(t, plekken.children[+t.dataset.slot]));
  });
  addEventListener('resize', opnieuw);
  vensters.push(['resize', opnieuw]);

  return {
    stop() {
      gestopt = true;
      vensters.forEach(([n, f]) => removeEventListener(n, f));
      host.innerHTML = '';
    }
  };
}
