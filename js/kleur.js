/* Inkleuren en vrij tekenen.

   kleurvlak: de klaargetekende figuur met een kleurenpalet. Kies een kleur, tik een vlak, het vlak
   kleurt. Geen vulemmer-algoritme nodig: elke gesloten vorm uit de tekening is zelf een vlak, en
   wat later getekend is ligt bovenop. Altijd opnieuw te kleuren; niets kan misgaan.

   vrijtekenen: een leeg blad met dezelfde kleuren, een 'ongedaan'-knop en een 'alles weg'-knop.
   Geen kopieerdoel, geen beoordeling: ze mag gewoon krabbelen. */

const NS = 'http://www.w3.org/2000/svg';
const PAPIER = '#FFFDF8';

function el(naam, attr, ouder) {
  const e = document.createElementNS(NS, naam);
  for (const k in attr) e.setAttribute(k, attr[k]);
  if (ouder) ouder.appendChild(e);
  return e;
}

function palet(host, kleuren, onKies, extra = []) {
  const rij = document.createElement('div');
  rij.className = 'palet';
  let gekozen = 0;
  const knoppen = kleuren.map((k, i) => {
    const b = document.createElement('button');
    b.className = 'kleurknop' + (i === 0 ? ' gekozen' : '');
    b.style.background = k;
    b.setAttribute('aria-label', 'kleur ' + (i + 1));
    b.onclick = () => {
      gekozen = i;
      knoppen.forEach((x, j) => x.classList.toggle('gekozen', j === i));
      onKies(k);
    };
    rij.appendChild(b);
    return b;
  });
  for (const e of extra) {
    const b = document.createElement('button');
    b.className = 'kleurknop actie';
    b.setAttribute('aria-label', e.label);
    b.innerHTML = e.svg;
    b.onclick = e.doe;
    rij.appendChild(b);
  }
  host.appendChild(rij);
  return rij;
}

export function kleurvlak(host, { streken, kleuren, inkt, onKleur = () => {} }) {
  host.innerHTML = '';
  const svg = el('svg', { viewBox: '0 0 100 140', class: 'kleur-svg', role: 'img', 'aria-label': 'tekening om in te kleuren' }, host);
  let kleur = kleuren[0];

  for (const st of streken) {
    if (st.tap) { el('circle', { cx: st.tap[0], cy: st.tap[1], r: st.r || 3, fill: inkt }, svg); continue; }
    const p = el('path', { d: st.d, fill: st.vul ? PAPIER : 'none', stroke: inkt, 'stroke-width': 1.8,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    if (st.vul) {
      p.setAttribute('class', 'vlak');
      p.addEventListener('click', () => { p.setAttribute('fill', kleur); onKleur(kleur); });
    }
  }
  palet(host, kleuren, k => { kleur = k; });
  return { stop() { host.innerHTML = ''; } };
}

export function vrijtekenen(host, { kleuren }) {
  host.innerHTML = '';
  const svg = el('svg', { viewBox: '0 0 1000 700', class: 'vrij-svg', role: 'img', 'aria-label': 'leeg blad om op te tekenen' }, host);
  el('rect', { x: 0, y: 0, width: 1000, height: 700, fill: PAPIER }, svg);
  const lijnen = el('g', {}, svg);
  let kleur = kleuren[0], actief = null, lijn = null, punten = [];

  const coord = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [Math.round(m.x), Math.round(m.y)];
  };
  svg.addEventListener('pointerdown', e => {
    if (actief !== null) return;
    e.preventDefault();
    actief = e.pointerId;
    try { svg.setPointerCapture(e.pointerId); } catch {}
    punten = [coord(e)];
    // Een tik is een stip: een lijn van één punt zou onzichtbaar zijn.
    lijn = el('polyline', { fill: 'none', stroke: kleur, 'stroke-width': 14, 'stroke-linecap': 'round',
      'stroke-linejoin': 'round', points: punten[0].concat(punten[0]).join(',') }, lijnen);
  });
  svg.addEventListener('pointermove', e => {
    if (e.pointerId !== actief || !lijn) return;
    punten.push(coord(e));
    lijn.setAttribute('points', punten.map(p => p.join(',')).join(' '));
  });
  const los = e => { if (e.pointerId === actief) { actief = null; lijn = null; } };
  svg.addEventListener('pointerup', los);
  svg.addEventListener('pointercancel', los);

  palet(host, kleuren, k => { kleur = k; }, [
    { label: 'laatste streek weg', doe: () => lijnen.lastChild && lijnen.removeChild(lijnen.lastChild),
      svg: '<svg viewBox="0 0 24 24"><path d="M12.5 8c-2.7 0-5.1 1-7 2.6L2 7v9h9l-3.6-3.6c1.4-1.2 3.2-1.9 5.1-1.9 3.5 0 6.5 2.3 7.6 5.5l2.4-.8C21.1 10.8 17.1 8 12.5 8z"/></svg>' },
    { label: 'alles weg', doe: () => { while (lijnen.firstChild) lijnen.removeChild(lijnen.firstChild); },
      svg: '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>' }
  ]);
  return { stop() { host.innerHTML = ''; } };
}
