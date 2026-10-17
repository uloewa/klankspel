/* Schrijven met de vinger.

   Eén schrijfvlak voor één letter. De vier niveaus bouwen de hulp stap voor stap af:
     1 kijk en volg -- een stipje toont eerst hoe, daarna volgt ze met pijl en stippellijn
     2 pijl en stippen
     3 alleen de genummerde startpunten
     4 zelf -- niets op het scherm

   Twee afspraken die hier niet onderhandelbaar zijn (zie ook stijl.css):
   - NOOIT "fout". Een streek die niet lukt vervaagt zacht; er valt niets te verliezen.
   - Een streek is geslaagd als haar vinger het pad in volgorde heeft gevolgd binnen de
     tolerantie. Dat is bewust ruim: kinderen van deze leeftijd missen kleine doelen en
     raken het scherm kwijt tijdens het slepen. Dat een lijn niet mooi is, telt niet. */

const NS = 'http://www.w3.org/2000/svg';
const KAART_DIEP = '#E0D2BB', ZACHT = '#8A7F72', VRIEND = '#E8956B', VRIEND_DIEP = '#C9764F',
      GOED = '#3F7D5C', VINGER = '#5B8DB8';

function el(naam, attr, ouder) {
  const e = document.createElementNS(NS, naam);
  for (const k in attr) e.setAttribute(k, attr[k]);
  if (ouder) ouder.appendChild(e);
  return e;
}
const leeg = g => { while (g.firstChild) g.removeChild(g.firstChild); };
const afstand = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const rustigeBeweging = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function schrijfvlak(host, opties) {
  const {
    streken, niveau: startNiveau = 1,
    tolerantie = { 1: 15, 2: 14, 3: 13, 4: 12 },
    onStreek = () => {}, onMis = () => {}, onKlaar = () => {}
  } = opties;

  host.innerHTML = '';
  const svg = el('svg', { viewBox: '0 0 100 140', class: 'schrijf-svg', role: 'img', 'aria-label': 'schrijfvlak' }, host);
  const gids = el('g', {}, svg), klaar = el('g', {}, svg), live = el('g', {}, svg), hint = el('g', {}, svg);

  let niveau = startNiveau, idx = 0, punten = null, lijn = null, actiefId = null;
  let demoTimer = null, demoRaf = null, gestopt = false;

  /* 40 punten langs het pad (of het ene punt van een tik): daaraan toetsen we haar vinger. */
  const monsters = streken.map(st => {
    if (st.tap) return [st.tap];
    const p = el('path', { d: st.d }, svg), L = p.getTotalLength(), r = [];
    for (let i = 0; i <= 40; i++) { const q = p.getPointAtLength(L * i / 40); r.push([q.x, q.y]); }
    svg.removeChild(p);
    return r;
  });

  const stopDemo = () => { clearTimeout(demoTimer); cancelAnimationFrame(demoRaf); };

  function pijl(d) {
    const p = el('path', { d }, svg), L = p.getTotalLength();
    const a = p.getPointAtLength(L * .5), b = p.getPointAtLength(L * .5 + 3);
    svg.removeChild(p);
    const hoek = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    el('path', { d: 'M-6 -5 L5 0 L-6 5 Z', fill: ZACHT, transform: `translate(${a.x},${a.y}) rotate(${hoek})` }, gids);
  }

  function teken() {
    stopDemo(); leeg(gids); leeg(hint);
    /* Eerst alle sporen, dan de startpunten erbovenop: bij letters als de d ligt het begin van
       de ene streek op de andere, en dan verdween het genummerde punt onder een pijl.
       Een pijl krijgt alleen de streek die nu aan de beurt is. */
    streken.forEach((st, i) => {
      if (i < idx || niveau > 2) return;
      const actief = i === idx, s0 = monsters[i][0];
      if (st.tap) {
        el('circle', { cx: s0[0], cy: s0[1], r: 12, fill: 'none', stroke: ZACHT, 'stroke-width': 2.5,
          'stroke-dasharray': '1 6', 'stroke-linecap': 'round' }, gids);
        return;
      }
      el('path', { d: st.d, fill: 'none', stroke: KAART_DIEP, 'stroke-width': 16, 'stroke-linecap': 'round',
        opacity: actief ? .75 : .3 }, gids);
      el('path', { d: st.d, fill: 'none', stroke: ZACHT, 'stroke-width': 2.5, 'stroke-dasharray': '1 7',
        'stroke-linecap': 'round' }, gids);
      if (actief) pijl(st.d);
    });
    if (niveau <= 3) {
      streken.forEach((st, i) => {
        if (i < idx) return;
        const actief = i === idx, s0 = monsters[i][0];
        el('circle', { cx: s0[0], cy: s0[1], r: 7, fill: VRIEND, stroke: VRIEND_DIEP, 'stroke-width': 2,
          class: actief ? 'puls' : '', opacity: actief ? 1 : .55 }, gids);
        const t = el('text', { x: s0[0], y: s0[1] + 3.2, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 700,
          fill: '#fff', 'font-family': 'Andika' }, gids);
        t.textContent = i + 1;
      });
    }
    if (niveau === 1) demo();
  }

  /* Niveau 1: eerst laat het stipje zien hoe. Daarna blijft de pijl staan en is het haar beurt. */
  function demo() {
    stopDemo(); leeg(hint);
    const st = streken[idx];
    if (st.tap) {
      el('circle', { cx: st.tap[0], cy: st.tap[1], r: 9, fill: VRIEND, class: 'puls' }, hint);
      demoTimer = setTimeout(() => leeg(hint), 1800);
      return;
    }
    const meet = el('path', { d: st.d, visibility: 'hidden' }, hint), L = meet.getTotalLength();
    const spoor = el('path', { d: st.d, fill: 'none', stroke: VRIEND, 'stroke-width': 6, 'stroke-linecap': 'round',
      'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': rustigeBeweging() ? 0 : L }, hint);
    const pen = el('circle', { r: 7, fill: VRIEND_DIEP, stroke: '#fff', 'stroke-width': 2 }, hint);
    if (rustigeBeweging()) return;
    let t0 = null;
    const stap = ts => {
      if (t0 === null) t0 = ts;
      const f = Math.min(1, (ts - t0) / 1500), q = meet.getPointAtLength(L * f);
      spoor.setAttribute('stroke-dashoffset', L * (1 - f));
      pen.setAttribute('cx', q.x); pen.setAttribute('cy', q.y);
      if (f < 1) demoRaf = requestAnimationFrame(stap);
      else demoTimer = setTimeout(() => leeg(hint), 900);
    };
    demoRaf = requestAnimationFrame(stap);
  }

  function coord(e) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [m.x, m.y];
  }

  /* Geslaagd als: ze begint bij het begin, eindigt bij het einde, passeert het pad in
     volgorde, en dwaalt gemiddeld niet te ver af. */
  function beoordeel() {
    const st = streken[idx], S = monsters[idx], tol = tolerantie[niveau], N = S.length;
    if (st.tap) return afstand(punten[0], S[0]) < tol * (niveau === 4 ? 2.2 : 1.5);
    if (punten.length < 3) return false;
    if (afstand(punten[0], S[0]) > tol * 2.2) return false;
    if (afstand(punten[punten.length - 1], S[N - 1]) > tol * 2.2) return false;
    let j = 0, geraakt = 0;
    for (let i = 0; i < N; i++) {
      for (let k = j; k < punten.length; k++) {
        if (afstand(punten[k], S[i]) < tol) { geraakt++; j = k; break; }
      }
    }
    if (geraakt < N * .85) return false;
    let som = 0;
    for (const p of punten) som += Math.min(...S.map(s => afstand(p, s)));
    return som / punten.length < tol * .9;
  }

  function neerGaan(e) {
    if (gestopt || idx >= streken.length || actiefId !== null) return;
    e.preventDefault(); stopDemo(); leeg(hint);
    actiefId = e.pointerId;
    try { svg.setPointerCapture(e.pointerId); } catch {}
    punten = [coord(e)];
    lijn = el('polyline', { fill: 'none', stroke: VINGER, 'stroke-width': 7, 'stroke-linecap': 'round',
      'stroke-linejoin': 'round', points: punten[0].join(','), class: 'vervaag' }, live);
  }
  function bewegen(e) {
    if (!punten || e.pointerId !== actiefId) return;
    punten.push(coord(e));
    lijn.setAttribute('points', punten.map(p => p.join(',')).join(' '));
  }
  function loslaten(e) {
    if (!punten || e.pointerId !== actiefId) return;
    const ok = beoordeel(), oud = lijn, st = streken[idx], p0 = punten[0];
    punten = null; actiefId = null;

    if (ok) {
      live.removeChild(oud);
      if (st.tap) {
        const b = el('circle', { cx: st.tap[0], cy: st.tap[1], r: 8, fill: GOED, class: 'puls' }, klaar);
        setTimeout(() => b.removeAttribute('class'), 1100);
      } else {
        el('path', { d: st.d, fill: 'none', stroke: GOED, 'stroke-width': 9, 'stroke-linecap': 'round' }, klaar);
      }
      idx++;
      onStreek(idx - 1);
      if (idx >= streken.length) { stopDemo(); leeg(gids); leeg(hint); onKlaar(); }
      else teken();
      return;
    }

    /* Niet gelukt: geen straf. De lijn vervaagt, en op niveau 1 toont het stipje het nog eens. */
    let weg = oud;
    if (st.tap) { live.removeChild(oud); weg = el('circle', { cx: p0[0], cy: p0[1], r: 5, fill: VINGER, class: 'vervaag' }, live); }
    weg.style.opacity = 0;
    setTimeout(() => weg.parentNode && weg.parentNode.removeChild(weg), 950);
    onMis(idx);
    if (niveau === 1) demoTimer = setTimeout(demo, 500);
  }

  svg.addEventListener('pointerdown', neerGaan);
  svg.addEventListener('pointermove', bewegen);
  svg.addEventListener('pointerup', loslaten);
  svg.addEventListener('pointercancel', loslaten);

  teken();

  return {
    zetNiveau(n) { niveau = n; idx = 0; leeg(klaar); leeg(live); teken(); },
    opnieuw() { idx = 0; leeg(klaar); leeg(live); teken(); },
    stop() { gestopt = true; stopDemo(); host.innerHTML = ''; }
  };
}

/* Hoe ver is ze per letter? Alleen op het toestel, net als alles in deze app.

   Niveau gaat omhoog na twee geslaagde keren op rij zonder veel misser, en zakt terug als
   ze op een letter drie keer mist: de hulp komt dan terug in plaats van dat ze blijft
   hangen. 'beheerst' = de letter af op niveau 4 (zelf) zonder veel missers. */
const SLEUTEL = 'klankspel-schrijven';
const LEEG = () => ({ niveau: 1, goed: 0, keer: 0, beheerst: false });

function lees() {
  try { return JSON.parse(localStorage.getItem(SLEUTEL) || '{}'); } catch { return {}; }
}
function schrijf(o) { try { localStorage.setItem(SLEUTEL, JSON.stringify(o)); } catch {} }

export const Voortgang = {
  lees: letter => ({ ...LEEG(), ...lees()[letter] }),

  klaar(letter, missen) {
    const alles = lees(), v = { ...LEEG(), ...alles[letter] };
    v.keer++;
    if (missen >= 3) { v.niveau = Math.max(1, v.niveau - 1); v.goed = 0; }
    else {
      v.goed++;
      if (v.niveau === 4) v.beheerst = true;
      else if (v.goed >= 2) { v.niveau++; v.goed = 0; }
    }
    alles[letter] = v;
    schrijf(alles);
    return v;
  }
};
