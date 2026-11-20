/* Sylve : animations et interactions.
   GSAP 3.13 + ScrollTrigger + SplitText, défilement doux par Lenis. */
(() => {
  'use strict';

  const root = document.documentElement;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

  /* ------------------------------------------------------------------
     Données
  ------------------------------------------------------------------ */
  const MODELS = {
    seve:   { name: 'Sève',        price: 39900, L: 430, trailer: true },
    refuge: { name: 'Refuge',      price: 54900, L: 520, trailer: true },
    cime:   { name: 'Cime',        price: 69900, L: 600, trailer: false },
    large:  { name: 'Grand Large', price: 84900, L: 680, trailer: false }
  };
  const CLAD = {
    meleze:  { name: 'Mélèze naturel', color: '#B78252', price: 0 },
    brule:   { name: 'Bois brûlé',     color: '#2E2925', price: 2400 },
    douglas: { name: 'Douglas grisé',  color: '#8F8B80', price: 900 }
  };
  const ROOF = {
    acier: { name: 'Bac acier anthracite', color: '#2B2F2D', price: 0 },
    zinc:  { name: 'Zinc naturel',         color: '#A3A9A6', price: 1900 }
  };
  const OPTS = {
    poele:     { name: 'poêle à bois', price: 2900 },
    solaire:   { name: 'kit solaire', price: 7400 },
    terrasse:  { name: 'terrasse', price: 3800 },
    toilettes: { name: 'toilettes sèches', price: 1200 },
    hiver:     { name: 'pack grand froid', price: 2600 }
  };

  /* ------------------------------------------------------------------
     Maison SVG (atelier + configurateur)
  ------------------------------------------------------------------ */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f))));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  };
  const rect = (x, y, w, h) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;

  function buildHouse(svg, { L, trailer, uid }) {
    svg.setAttribute('viewBox', '0 0 900 520');
    svg.innerHTML = '';
    const x0 = Math.round((900 - L) / 2) - 10;
    const xR = x0 + L;
    const FLOOR = trailer ? 392 : 384;
    const GROUND = 468;
    const top0 = 132, slope = 0.085;
    const yTop = x => top0 + (x - x0) * slope;
    const R = {};

    const defs = el('defs', {}, svg);
    const pat = el('pattern', { id: uid + '-hatch', width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(40)' }, defs);
    el('rect', { width: 10, height: 10, fill: '#DCCBA2' }, pat);
    el('path', { d: 'M0 0V10', stroke: '#BFA674', 'stroke-width': 4 }, pat);
    const flt = el('filter', { id: uid + '-blur', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
    el('feGaussianBlur', { stdDeviation: 16 }, flt);

    const g = name => el('g', { class: 's-' + name }, svg);

    // Sol
    R.ground = g('ground');
    R.groundLine = el('path', { d: `M20 ${GROUND}H880`, class: 'stroke ground' }, R.ground);

    // Base : remorque ou pieux vissés
    R.base = g('base');
    R.baseLines = [];
    R.wheels = [];
    if (trailer) {
      R.baseLines.push(el('path', { d: rect(x0 - 20, FLOOR + 10, L + 40, 12), class: 'steel' }, R.base));
      R.baseLines.push(el('path', { d: `M${x0 - 20} ${FLOOR + 14}L${x0 - 92} ${FLOOR + 30}L${x0 - 20} ${FLOOR + 22}`, class: 'steel' }, R.base));
      R.baseLines.push(el('path', { d: `M${x0 - 58} ${FLOOR + 24}V${GROUND - 4}M${x0 - 68} ${GROUND - 4}H${x0 - 48}`, class: 'steel' }, R.base));
      const mid = x0 + L * 0.5;
      [mid - 33, mid + 33].forEach(cx => {
        const w = el('g', { class: 'wheelg' }, R.base);
        el('circle', { cx, cy: GROUND - 27, r: 27, class: 'wheel' }, w);
        el('circle', { cx, cy: GROUND - 27, r: 9, class: 'hub' }, w);
        R.wheels.push(w);
      });
    } else {
      R.baseLines.push(el('path', { d: rect(x0 - 8, FLOOR + 6, L + 16, 10), class: 'steel' }, R.base));
      const n = Math.max(3, Math.round(L / 150));
      for (let i = 0; i <= n; i++) {
        const x = x0 + 24 + i * ((L - 48) / n);
        R.baseLines.push(el('path', { d: `M${x} ${FLOOR + 16}V${GROUND}M${x - 12} ${GROUND}H${x + 12}`, class: 'steel' }, R.base));
      }
    }

    // Isolation (sous l'ossature)
    R.insul = el('polygon', {
      points: `${x0 + 3},${FLOOR - 8} ${xR - 3},${FLOOR - 8} ${xR - 3},${yTop(xR) + 3} ${x0 + 3},${yTop(x0) + 3}`,
      fill: `url(#${uid}-hatch)`
    }, g('insul'));

    // Ossature
    R.frame = g('frame');
    R.floor = el('path', { d: rect(x0, FLOOR - 8, L, 18), class: 'floor' }, R.frame);
    R.studs = [];
    const ns = Math.round(L / 40);
    for (let i = 0; i <= ns; i++) {
      const x = x0 + 2.5 + i * ((L - 5) / ns);
      R.studs.push(el('path', { d: `M${x} ${FLOOR - 8}V${yTop(x)}`, class: 'stud' }, R.frame));
    }
    R.studs.push(el('path', { d: `M${x0} ${yTop(x0)}L${xR} ${yTop(xR)}`, class: 'stud' }, R.frame));

    // Bardage
    R.clad = g('clad');
    R.boards = [];
    const bw = L / Math.round(L / 19);
    for (let x = x0, i = 0; x < xR - 1; x += bw, i++) {
      const xb = Math.min(xR, x + bw - 1.4);
      const b = el('polygon', { points: `${x},${FLOOR + 10} ${xb},${FLOOR + 10} ${xb},${yTop(xb) - 1} ${x},${yTop(x) - 1}`, class: 'board' }, R.clad);
      b.dataset.f = (0.9 + ((i * 37) % 11) / 55).toFixed(3);
      R.boards.push(b);
    }

    // Halo lumineux (derrière les menuiseries, déborde sur le bardage)
    R.halo = g('halo');
    R.halo.setAttribute('filter', `url(#${uid}-blur)`);
    R.halo.setAttribute('opacity', '0');

    // Menuiseries
    R.open = g('open');
    R.glows = [];
    const win = (x, y, w, h, mullion) => {
      el('rect', { x: x - 6, y: y - 6, width: w + 12, height: h + 12, rx: 2, class: 'frame' }, R.open);
      el('rect', { x, y, width: w, height: h, class: 'glass' }, R.open);
      const gl = el('rect', { x, y, width: w, height: h, class: 'glow', opacity: 0 }, R.open);
      R.glows.push(gl);
      if (mullion) el('rect', { x: x + w / 2 - 2.5, y, width: 5, height: h, class: 'frame' }, R.open);
      el('rect', { x: x - 10, y: y - 10, width: w + 20, height: h + 20, class: 'halo' }, R.halo);
    };
    const wx = x0 + L * 0.09, ww = Math.max(100, Math.min(170, L * 0.24));
    win(wx, yTop(wx + ww) + 44, ww, FLOOR - 70 - (yTop(wx + ww) + 44), true);
    const sx = x0 + L * 0.45, sw = 62;
    win(sx, yTop(sx + sw) + 40, sw, 74, false);
    const dx = x0 + L * 0.74, dw = 50;
    el('rect', { x: dx - 5, y: FLOOR - 154, width: dw + 10, height: 154, class: 'frame' }, R.open);
    const dg = el('rect', { x: dx + 14, y: FLOOR - 140, width: dw - 28, height: 70, class: 'glass' }, R.open);
    const dgl = el('rect', { x: dx + 14, y: FLOOR - 140, width: dw - 28, height: 70, class: 'glow', opacity: 0 }, R.open);
    R.glows.push(dgl);
    el('rect', { x: dx - 6, y: FLOOR - 150, width: dw + 12, height: 120, class: 'halo' }, R.halo);
    R.doorX = dx; R.doorW = dw;
    void dg;

    // Marches devant la porte
    R.steps = g('steps');
    const stepH = (GROUND - (FLOOR + 10)) / 3;
    for (let i = 0; i < 3; i++) {
      el('path', { d: rect(dx - 14 - i * 12, FLOOR + 10 + i * stepH, dw + 28 + i * 24, 7), class: 'deck' }, R.steps);
    }
    el('path', { d: `M${dx - 38} ${FLOOR + 17}V${GROUND}M${dx + dw + 38} ${FLOOR + 17}V${GROUND}`, class: 'post' }, R.steps);

    // Toiture et cheminée
    R.roofG = g('roof');
    const ra = x0 - 26, rb = xR + 26;
    const rTop = x => yTop(x) - 1;
    R.chim = el('path', { d: rect(x0 + L * 0.64, rTop(x0 + L * 0.64) - 82, 16, 80), class: 'chim' }, R.roofG);
    el('path', { d: rect(x0 + L * 0.64 - 4, rTop(x0 + L * 0.64) - 88, 24, 7), class: 'chim' }, R.roofG);
    R.roof = el('polygon', { points: `${ra},${rTop(ra) - 16} ${rb},${rTop(rb) - 16} ${rb},${rTop(rb)} ${ra},${rTop(ra)}`, class: 'roof' }, R.roofG);
    R.fascia = el('polygon', { points: `${ra},${rTop(ra) - 3} ${rb},${rTop(rb) - 3} ${rb},${rTop(rb) + 3} ${ra},${rTop(ra) + 3}`, class: 'fascia' }, R.roofG);

    // Fumée
    R.smoke = g('smoke');
    const cx = x0 + L * 0.64 + 8, cy = rTop(x0 + L * 0.64) - 96;
    R.puffs = [0, 1, 2].map(i => el('path', {
      d: `M${cx} ${cy}c-10 -14 10 -22 0 -36c-8 -11 8 -18 2 -28`,
      class: 'smoke', opacity: 0, transform: `translate(${i * 4} 0)`
    }, R.smoke));

    // Panneaux solaires (option)
    R.solar = g('solar');
    const sa = x0 + L * 0.08, sb = x0 + L * 0.56, k = 3, gap = 8, pw = (sb - sa - gap * (k - 1)) / k;
    for (let i = 0; i < k; i++) {
      const a = sa + i * (pw + gap), b = a + pw;
      el('polygon', { points: `${a},${rTop(a) - 20} ${b},${rTop(b) - 20} ${b},${rTop(b) - 27} ${a},${rTop(a) - 27}`, class: 'solar' }, R.solar);
    }
    R.solar.setAttribute('opacity', '0');

    // Terrasse (option)
    R.deck = g('deck');
    const da = xR + 8, db = xR + 100;
    el('path', { d: rect(da, FLOOR - 2, db - da, 10), class: 'deck' }, R.deck);
    el('path', { d: `M${da + 10} ${FLOOR + 8}V${GROUND}M${db - 10} ${FLOOR + 8}V${GROUND}M${db - 6} ${FLOOR - 2}V${FLOOR - 62}M${da + 46} ${FLOOR - 2}V${FLOOR - 62}M${da} ${FLOOR - 60}H${db - 2}`, class: 'post' }, R.deck);
    R.deck.setAttribute('opacity', '0');

    return R;
  }

  function paintHouse(R, cladHex, roofHex) {
    R.boards.forEach(b => b.setAttribute('fill', shade(cladHex, +b.dataset.f)));
    R.roof.setAttribute('fill', roofHex);
    R.fascia.setAttribute('fill', shade(roofHex, 0.75));
  }

  function smokeLoop(R) {
    const tl = gsap.timeline({ repeat: -1, paused: true });
    R.puffs.forEach((p, i) => {
      tl.fromTo(p, { opacity: 0, y: 6, scale: 0.8, transformOrigin: '50% 100%' },
        { opacity: 0.85, y: -18, scale: 1, duration: 1.4, ease: 'sine.out' }, i * 1.1)
        .to(p, { opacity: 0, y: -46, duration: 1.6, ease: 'sine.in' }, i * 1.1 + 1.4);
    });
    return tl;
  }

  const prepDraw = path => {
    const len = path.getTotalLength ? path.getTotalLength() : 600;
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    return path;
  };

  /* ------------------------------------------------------------------
     Démarrage
  ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------
     Hero : le titre tient toujours dans le ciel, quel que soit le cadrage
     (la photo est en object-fit: cover, la ligne d'arbres bouge avec le ratio)
  ------------------------------------------------------------------ */
  const SKY = { line: 0.335, tree: 0.575, w: 2000, h: 1333 }; // fractions mesurées sur la photo
  function fitHero() {
    const hero = $('.hero'), title = $('.hero__title'), img = $('.hero__plane--fg img');
    if (!hero || !title || !img) return;
    const W = hero.clientWidth, H = hero.clientHeight;
    const scale = Math.max(W / SKY.w, H / SKY.h);
    const dw = SKY.w * scale, dh = SKY.h * scale;
    const pos = getComputedStyle(img).objectPosition.split(' ').map(v => parseFloat(v) / 100);
    const ox = (W - dw) * (isNaN(pos[0]) ? 0.5 : pos[0]);
    const oy = (H - dh) * (isNaN(pos[1]) ? 0.5 : pos[1]);
    const skyY = oy + SKY.line * dh;             // haut de la ligne d'arbres, en px écran
    const treeX = ox + SKY.tree * dw;            // bord gauche du grand arbre / toit
    const navH = 76;
    const top = Math.max(navH + 14, Math.min(H * 0.15, skyY - 40 - 0.12 * W));
    // taille maximale voulue, puis contraintes de hauteur et de largeur
    const cssMax = Math.min(137.6, Math.max(49.6, W < 600 ? W * 0.13 : W * 0.074));
    title.style.setProperty('--hero-fs', cssMax + 'px');
    title.style.setProperty('--hero-top', top + 'px');
    const left = title.offsetLeft;
    const byH = (skyY - 14 - top) / 2.06;
    const byW = cssMax * (treeX - 24 - left) / Math.max(1, title.offsetWidth);
    let fs = Math.min(cssMax, byH, byW);
    const over = fs < 34;                        // ciel trop étroit : le titre passe devant la maison
    fs = Math.max(fs, Math.min(cssMax, 34));
    title.style.setProperty('--hero-fs', fs.toFixed(1) + 'px');
    hero.classList.toggle('is-over', over);
  }
  fitHero();
  window.addEventListener('resize', () => { fitHero(); }, { passive: true });
  if (document.fonts) document.fonts.ready.then(fitHero);

  const buildSvg = $('#buildHouse');
  const B = buildHouse(buildSvg, { L: 540, trailer: true, uid: 'b' });
  paintHouse(B, CLAD.meleze.color, ROOF.acier.color);

  // Sans GSAP (CDN indisponible) ou mouvement réduit : version statique et complète
  if (!hasGsap || reduced) {
    root.classList.add('reduced');
    const intro = $('.intro'); if (intro) intro.remove();
    B.glows.forEach(g => g.setAttribute('opacity', 0.9));
    B.halo.setAttribute('opacity', '0.5');
    initConfigurator(false);
    initReviews(false);
    initForm();
    initMenu(null);
    const nav = $('.nav');
    const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > window.innerHeight * 0.85);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (hasGsap) gsap.set('.hero__title .line > span', { clearProps: 'all' });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Lenis : défilement doux, synchronisé avec le ticker GSAP
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  root.style.overflow = 'hidden';

  // Liens d'ancre
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu && closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: id === '#hero' ? 0 : -10, duration: 1.6 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  let closeMenu = null;
  closeMenu = initMenu(lenis);

  const ready = Promise.race([
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...$$('.hero img').map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve())
    ]),
    new Promise(r => setTimeout(r, 3500))
  ]);

  ready.then(() => {
    intro();
    initScroll();
    initConfigurator(true);
    initReviews(true);
    initForm();
    initMicro();
    ScrollTrigger.refresh();
  });

  /* ------------------------------------------------------------------
     Intro : les battants s'ouvrent, le titre se lève derrière la forêt
  ------------------------------------------------------------------ */
  function intro() {
    const word = new SplitText('.intro__word', { type: 'chars', mask: 'chars' });
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    gsap.set('.hero__title .line > span', { yPercent: 115 });
    gsap.set('.hero__plane--sky', { scale: 1.32 });
    gsap.set('.hero__plane--fg', { scale: 1.16, yPercent: 4 });
    gsap.set('.hero__meta > *', { autoAlpha: 0, y: 28 });
    gsap.set('.nav', { autoAlpha: 0, y: -24 });
    gsap.set('.intro__lamp', { scaleX: 0 });
    gsap.set('.intro__place', { autoAlpha: 0, y: 10 });

    tl.from(word.chars, { yPercent: 110, duration: 1.1, stagger: 0.06 }, 0.15)
      .to('.intro__lamp', { scaleX: 1, duration: 1, ease: 'power3.inOut' }, 0.55)
      .to('.intro__place', { autoAlpha: 1, y: 0, duration: 0.8 }, 0.9)
      .to('.intro__mark', { autoAlpha: 0, y: -16, duration: 0.6, ease: 'power2.in' }, 1.9)
      .to('.intro__door--l', { xPercent: -101, duration: 1.5, ease: 'expo.inOut' }, 2.25)
      .to('.intro__door--r', { xPercent: 101, duration: 1.5, ease: 'expo.inOut' }, 2.25)
      .to('.hero__plane--sky', { scale: 1, duration: 2.8, ease: 'expo.out' }, 2.35)
      .to('.hero__plane--fg', { scale: 1, yPercent: 0, duration: 2.4, ease: 'expo.out' }, 2.45)
      .to('.hero__title .line > span', { yPercent: 0, duration: 1.5, stagger: 0.14 }, 3.0)
      .to('.nav', { autoAlpha: 1, y: 0, duration: 1 }, 3.3)
      .to('.hero__meta > *', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12 }, 3.45)
      .add(() => {
        root.style.overflow = '';
        if (lenis) lenis.start();
      }, 3.3)
      .add(() => { const i = $('.intro'); if (i) i.remove(); word.revert(); }, 4);
  }

  /* ------------------------------------------------------------------
     Scroll
  ------------------------------------------------------------------ */
  function initScroll() {
    // Barre de progression
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    const mm = gsap.matchMedia();

    /* --- Hero : le titre se couche derrière la ligne d'arbres --- */
    mm.add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, ctx => {
      const { mobile } = ctx.conditions;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.hero', start: 'top top', end: mobile ? '+=110%' : '+=140%', pin: true, scrub: 0.6, anticipatePin: 1 }
      });
      tl.to('.hero__plane--sky', { scale: 1.1, yPercent: 7, duration: 1 }, 0)
        .to('.hero__title', { yPercent: mobile ? 70 : 125, scale: 0.94, transformOrigin: '0% 0%', duration: 0.62 }, 0)
        .to('.hero__plane--fg', { scale: 1.14, yPercent: -3, duration: 1 }, 0)
        .to('.hero__mist', { xPercent: 8, yPercent: -10, duration: 1 }, 0)
        .to('.hero__meta', { autoAlpha: 0, y: -40, duration: 0.25 }, 0)
        .fromTo('.hero__second', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.22 }, 0.34)
        .to('.hero__second', { y: -30, duration: 0.3 }, 0.56)
        .fromTo('.hero__curtain', { clipPath: 'inset(100% 0% 0% 0% round 32px 32px 0px 0px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', duration: 0.3, ease: 'power2.inOut' }, 0.7);
      if (mobile) tl.to('.hero__title', { autoAlpha: 0, duration: 0.16 }, 0.1);
    });

    /* --- Manifeste : les mots s'allument --- */
    const words = new SplitText('[data-words]', { type: 'words', wordsClass: 'w' });
    gsap.fromTo(words.words, { opacity: 0.14 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: '.manifesto__text', start: 'top 82%', end: 'bottom 52%', scrub: true }
    });
    gsap.from('.facts > div', {
      y: 30, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.facts', start: 'top 88%' }
    });

    // Parallaxe générique
    $$('[data-parallax]').forEach(fig => {
      const v = parseFloat(fig.dataset.parallax) || 10;
      const img = $('img', fig);
      gsap.fromTo(img, { yPercent: -Math.abs(v) / 2 - 6 }, {
        yPercent: Math.abs(v) / 2 - 6, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
      });
      gsap.fromTo(fig, { y: v * 6 }, { y: -v * 6, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* --- Modèles --- */
    mm.add('(min-width: 901px)', () => {
      const track = $('.models__track');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const pan = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.models', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      gsap.to('.models__rail span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.models', start: 'top top', end: () => '+=' + dist(), scrub: 0.8, invalidateOnRefresh: true } });
      $$('.model').forEach(m => {
        const media = $('.model__media', m), img = $('img', m);
        gsap.fromTo(img, { xPercent: 5 }, { xPercent: -5, ease: 'none', scrollTrigger: { trigger: m, containerAnimation: pan, start: 'left right', end: 'right left', scrub: true } });
        gsap.fromTo(media, { clipPath: 'inset(0% 0% 0% 100% round 14px)' }, {
          clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'power2.out',
          scrollTrigger: { trigger: m, containerAnimation: pan, start: 'left 95%', end: 'left 45%', scrub: true }
        });
        gsap.from($$('.model__body > *', m), {
          x: 60, autoAlpha: 0, stagger: 0.05, ease: 'power2.out',
          scrollTrigger: { trigger: m, containerAnimation: pan, start: 'left 80%', end: 'left 35%', scrub: true }
        });
      });
      gsap.from('.models__intro > *', { y: 50, autoAlpha: 0, stagger: 0.1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.models', start: 'top 60%' } });
    });
    mm.add('(max-width: 900px)', () => {
      $$('.model').forEach(m => {
        gsap.fromTo($('.model__media', m), { clipPath: 'inset(18% 0% 0% 0% round 14px)' }, {
          clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'none',
          scrollTrigger: { trigger: m, start: 'top 95%', end: 'top 45%', scrub: true }
        });
        gsap.from($$('.model__body > *', m), { y: 30, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: $('.model__body', m), start: 'top 88%' } });
      });
    });

    /* --- Atelier : la maison se construit sous le scroll --- */
    mm.add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, ctx => {
      const { mobile } = ctx.conditions;
      const sec = $('.atelier');
      const steps = $$('.step');
      gsap.set(steps.slice(1), { autoAlpha: 0, y: 24 });
      gsap.set(steps[0], { autoAlpha: 1, y: 0 });
      [B.groundLine, ...B.baseLines, ...B.studs].forEach(prepDraw);
      gsap.set(B.wheels, { scale: 0.4, autoAlpha: 0, transformOrigin: '50% 50%' });
      gsap.set(B.floor, { scaleX: 0, transformOrigin: '0% 50%' });
      gsap.set(B.insul, { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set(B.boards, { y: 46, autoAlpha: 0 });
      gsap.set(B.roofG, { y: -90, autoAlpha: 0 });
      gsap.set([B.open, B.steps], { autoAlpha: 0 });
      gsap.set(B.glows, { attr: { opacity: 0 } });
      gsap.set(B.halo, { attr: { opacity: 0 } });

      const smoke = smokeLoop(B);
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: sec, start: 'top top', end: mobile ? '+=320%' : '+=460%', pin: true, scrub: 0.7, anticipatePin: 1,
          onUpdate: self => { self.progress > 0.88 ? smoke.play() : smoke.pause(0); }
        }
      });
      const swap = (i, t) => {
        tl.to(steps[i - 1], { autoAlpha: 0, y: -24, duration: 0.35, ease: 'power2.in' }, t)
          .to(steps[i], { autoAlpha: 1, y: 0, duration: 0.45 }, t + 0.3);
      };
      tl.to('.steps__rail span', { scaleX: 1, ease: 'none', duration: 10 }, 0);
      // 1. Châssis
      tl.to(B.groundLine, { strokeDashoffset: 0, duration: 1.2, ease: 'none' }, 0)
        .to(B.baseLines, { strokeDashoffset: 0, duration: 1.2, stagger: 0.12, ease: 'power1.inOut' }, 0.2)
        .to(B.wheels, { scale: 1, autoAlpha: 1, duration: 0.8, stagger: 0.15, ease: 'back.out(2)' }, 0.8);
      // 2. Ossature
      swap(1, 2);
      tl.to(B.floor, { scaleX: 1, duration: 0.8, ease: 'power3.inOut' }, 2.2)
        .to(B.studs, { strokeDashoffset: 0, duration: 0.7, stagger: 0.05, ease: 'power2.out' }, 2.6);
      // 3. Isolation
      swap(2, 4.2);
      tl.to(B.insul, { scaleY: 1, duration: 1.4, ease: 'power2.inOut' }, 4.4);
      // 4. Bardage
      swap(3, 6.2);
      tl.to(B.boards, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out' }, 6.3);
      // 5. Lumière
      swap(4, 8.2);
      tl.to(B.roofG, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, 8.2)
        .to([B.open, B.steps], { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, 8.6)
        .to(sec, { '--a-bg': '#161915', '--a-fg': '#F6F1E7', '--a-soft': '#BDB8A8', '--a-line': 'rgba(246,241,231,.4)', duration: 1, ease: 'none' }, 8.9)
        .to(B.glows, { attr: { opacity: 0.95 }, duration: 0.6, stagger: 0.1 }, 9.2)
        .to(B.halo, { attr: { opacity: 0.55 }, duration: 0.8 }, 9.3)
        .to({}, { duration: 0.6 }, 9.9);
    });

    /* --- Matières : volets qui s'ouvrent --- */
    $$('[data-reveal]').forEach(fig => {
      const box = $('.mat__img', fig), img = $('img', fig), cap = $('figcaption', fig);
      const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 86%' } });
      tl.fromTo(box, { clipPath: 'inset(100% 0% 0% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.4, ease: 'expo.inOut' })
        .fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.2)
        .from(cap, { y: 20, autoAlpha: 0, duration: 1, ease: 'expo.out' }, 0.7);
      gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    const mh = new SplitText('#materials-title', { type: 'lines', mask: 'lines' });
    gsap.from(mh.lines, { yPercent: 105, duration: 1.3, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.materials', start: 'top 75%' } });

    /* --- Fenêtre qui s'ouvre sur l'intérieur --- */
    mm.add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, ctx => {
      const { mobile } = ctx.conditions;
      const start = mobile ? 'inset(16% 14% 30% 14% round 999px 999px 16px 16px)' : 'inset(18% 34% 18% 34% round 999px 999px 18px 18px)';
      const wt = new SplitText('#window-title', { type: 'lines', mask: 'lines' });
      gsap.set(wt.lines, { yPercent: 105 });
      gsap.set('.window__notes li', { autoAlpha: 0, y: 18 });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.window', start: 'top top', end: '+=150%', pin: true, scrub: 0.7, anticipatePin: 1 }
      });
      tl.fromTo('.window__frame', { clipPath: start }, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', duration: 1, ease: 'power2.inOut' }, 0)
        .fromTo('.window__frame img', { scale: 1.3 }, { scale: 1, duration: 1.2 }, 0)
        .to('.window__frame', { '--shade': 1, duration: 0.4 }, 0.7)
        .to(wt.lines, { yPercent: 0, duration: 0.35, stagger: 0.06, ease: 'power3.out' }, 0.85)
        .to('.window__notes li', { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, 1)
        .to({}, { duration: 0.3 });
      return () => wt.revert();
    });

    /* --- Titres de sections --- */
    ['#config-title', '#reviews-title', '#faq-title', '#contact-title', '#models-title'].forEach(sel => {
      if (sel === '#models-title') return;
      const s = new SplitText(sel, { type: 'lines', mask: 'lines' });
      gsap.from(s.lines, { yPercent: 105, duration: 1.3, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: sel, start: 'top 85%' } });
    });
    gsap.from('.config__stage', { y: 80, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.config__grid', start: 'top 80%' } });
    gsap.from('.config__form fieldset, .config__cta', { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.config__form', start: 'top 85%' } });
    gsap.from('.qa', { y: 30, autoAlpha: 0, duration: 1, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: '.faq__list', start: 'top 85%' } });

    /* --- Bandeau des avis : vitesse liée au scroll --- */
    const marquee = gsap.to('.reviews__marquee', { xPercent: -50, repeat: -1, duration: 34, ease: 'none' });
    ScrollTrigger.create({
      trigger: '.reviews', start: 'top bottom', end: 'bottom top',
      onUpdate: self => {
        const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 300);
        gsap.to(marquee, { timeScale: (self.direction < 0 ? -1 : 1) * (1 + Math.abs(v)), duration: 0.4, overwrite: true });
      }
    });

    /* --- Contact et pied de page --- */
    gsap.fromTo('.contact__bg img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.contact__form', { y: 70, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.contact__grid', start: 'top 80%' } });
    gsap.from('.footer__word span', {
      yPercent: 100, autoAlpha: 0, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: 0.8 }
    });

    initNav();
  }

  /* ------------------------------------------------------------------
     Navigation : masquée en descendant, couleur selon la section
  ------------------------------------------------------------------ */
  function initNav() {
    const nav = $('.nav');
    const themes = [
      ['.hero', 'clear'], ['.manifesto', 'solid'], ['.models', 'dark'], ['.atelier', 'solid'],
      ['.materials', 'solid'], ['.window', 'dark'], ['.config', 'solid'], ['.reviews', 'dark'],
      ['.faq', 'solid'], ['.contact', 'dark'], ['.footer', 'dark']
    ];
    const set = t => {
      nav.classList.toggle('is-solid', t === 'solid');
      nav.classList.toggle('is-dark', t === 'dark');
    };
    themes.forEach(([sel, t]) => {
      const node = $(sel);
      const trig = node.parentElement && node.parentElement.classList.contains('pin-spacer') ? node.parentElement : node;
      ScrollTrigger.create({ trigger: trig, start: 'top 40px', end: 'bottom 40px', onToggle: self => { if (self.isActive) set(t); } });
    });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        const y = self.scroll();
        const hide = self.direction > 0 && y > window.innerHeight * 0.8 && !document.body.classList.contains('menu-open');
        nav.classList.toggle('is-hidden', hide);
      }
    });
  }

  /* ------------------------------------------------------------------
     Menu mobile
  ------------------------------------------------------------------ */
  function initMenu(lenisRef) {
    const btn = $('.nav__burger'), menu = $('#menu');
    if (!btn || !menu) return () => {};
    const links = $$('a', menu);
    let open = false;
    const close = () => {
      if (!open) return;
      open = false;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Ouvrir le menu');
      document.body.classList.remove('menu-open');
      if (lenisRef) lenisRef.start();
      if (hasGsap && !reduced) {
        gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.7, ease: 'expo.inOut', onComplete: () => { menu.hidden = true; } });
      } else menu.hidden = true;
    };
    btn.addEventListener('click', () => {
      if (open) return close();
      open = true;
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Fermer le menu');
      document.body.classList.add('menu-open');
      $('.nav').classList.remove('is-hidden');
      if (lenisRef) lenisRef.stop();
      if (hasGsap && !reduced) {
        gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.inOut' });
        gsap.fromTo(links, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.06, ease: 'expo.out', delay: 0.25 });
      }
    });
    if (!hasGsap || reduced) links.forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    return close;
  }

  /* ------------------------------------------------------------------
     Configurateur
  ------------------------------------------------------------------ */
  function initConfigurator(animated) {
    const form = $('#configForm'), svg = $('#configHouse');
    const totalEl = $('#total'), recapEl = $('#recap');
    let current = null, R = null, smoke = null;
    const counter = { v: 0 };

    const read = () => {
      const fd = new FormData(form);
      return { model: fd.get('model'), clad: fd.get('clad'), roof: fd.get('roof'), opts: fd.getAll('opt') };
    };
    const priceOf = s => MODELS[s.model].price + CLAD[s.clad].price + ROOF[s.roof].price + s.opts.reduce((a, k) => a + OPTS[k].price, 0);

    const show = (node, on) => {
      if (animated) gsap.to(node, { attr: { opacity: on ? 1 : 0 }, y: on ? 0 : -14, duration: 0.6, ease: 'expo.out' });
      else node.setAttribute('opacity', on ? 1 : 0);
    };

    const render = (first) => {
      const s = read();
      const m = MODELS[s.model];
      if (current !== s.model) {
        const rebuild = () => {
          R = buildHouse(svg, { L: m.L, trailer: m.trailer, uid: 'c' });
          R.glows.forEach(g => g.setAttribute('opacity', 0.9));
          R.halo.setAttribute('opacity', '0.35');
          if (smoke) smoke.kill();
          smoke = hasGsap && !reduced ? smokeLoop(R) : null;
          paint(s, true);
        };
        if (animated && !first) {
          gsap.to(svg, { autoAlpha: 0, x: -24, duration: 0.3, ease: 'power2.in', onComplete: () => {
            rebuild();
            gsap.fromTo(svg, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'expo.out' });
          } });
        } else rebuild();
        current = s.model;
      } else paint(s, false);

      const total = priceOf(s);
      if (animated) {
        gsap.to(counter, { v: total, duration: first ? 0 : 0.9, ease: 'power3.out', onUpdate: () => { totalEl.textContent = fmt.format(Math.round(counter.v / 10) * 10); } });
        if (!first) gsap.fromTo('.config__total', { y: 6 }, { y: 0, duration: 0.5, ease: 'back.out(3)' });
      } else totalEl.textContent = fmt.format(total);
      const optNames = s.opts.map(k => OPTS[k].name);
      recapEl.textContent = [m.name, CLAD[s.clad].name, ROOF[s.roof].name].join(' · ') + (optNames.length ? ' · ' + optNames.join(', ') : '');
      form.dataset.total = total;
    };

    function paint(s, instant) {
      if (!R) return;
      if (animated && !instant) {
        R.boards.forEach((b, i) => gsap.to(b, { attr: { fill: shade(CLAD[s.clad].color, +b.dataset.f) }, duration: 0.5, delay: i * 0.012, ease: 'power2.out' }));
        gsap.to(R.roof, { attr: { fill: ROOF[s.roof].color }, duration: 0.5 });
        gsap.to(R.fascia, { attr: { fill: shade(ROOF[s.roof].color, 0.75) }, duration: 0.5 });
      } else paintHouse(R, CLAD[s.clad].color, ROOF[s.roof].color);
      const on = k => s.opts.includes(k);
      if (instant) {
        R.solar.setAttribute('opacity', on('solaire') ? 1 : 0);
        R.deck.setAttribute('opacity', on('terrasse') ? 1 : 0);
        R.chim.parentNode && R.chim.setAttribute('opacity', 1);
      } else {
        show(R.solar, on('solaire'));
        show(R.deck, on('terrasse'));
      }
      if (smoke) on('poele') ? smoke.play() : smoke.pause(0);
      $$('.chim', svg).forEach(c => c.setAttribute('opacity', on('poele') ? 1 : 0));
    }

    form.addEventListener('change', () => render(false));
    render(true);

    // Les liens « Configurer X » des cartes modèles
    $$('[data-pick]').forEach(a => a.addEventListener('click', () => {
      const r = $('#m-' + a.dataset.pick);
      if (r && !r.checked) { r.checked = true; render(false); }
    }));

    // Transmet la configuration au formulaire de contact
    $('#configCta').addEventListener('click', () => {
      const s = read();
      $('#f-model').value = s.model;
      $('#f-type').value = 'Devis détaillé';
      $('#f-msg').value = `Configuration : ${recapEl.textContent}. Estimation : ${fmt.format(priceOf(s))} € TTC.`;
    });
  }

  /* ------------------------------------------------------------------
     Avis
  ------------------------------------------------------------------ */
  function initReviews(animated) {
    const items = $$('.review'), dots = $$('.reviews__dots button');
    let i = 0, timer = null, busy = false;
    const go = n => {
      n = (n + items.length) % items.length;
      if (n === i || busy) return;
      const from = items[i], to = items[n];
      dots.forEach((d, k) => d.setAttribute('aria-selected', String(k === n)));
      if (!animated) { from.classList.remove('is-active'); to.classList.add('is-active'); i = n; return; }
      busy = true;
      const split = new SplitText($('blockquote', to), { type: 'lines', mask: 'lines' });
      gsap.timeline({ onComplete: () => { split.revert(); busy = false; } })
        .to(from, { autoAlpha: 0, y: -20, duration: 0.45, ease: 'power2.in' })
        .add(() => { from.classList.remove('is-active'); to.classList.add('is-active'); gsap.set(to, { autoAlpha: 1, y: 0 }); })
        .from(split.lines, { yPercent: 105, duration: 1.1, stagger: 0.08, ease: 'expo.out' })
        .from($('figcaption', to), { autoAlpha: 0, y: 12, duration: 0.7, ease: 'expo.out' }, '-=0.8');
      i = n;
    };
    $('#revNext').addEventListener('click', () => { go(i + 1); restart(); });
    $('#revPrev').addEventListener('click', () => { go(i - 1); restart(); });
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); restart(); }));
    const stop = () => { clearInterval(timer); timer = null; };
    const restart = () => { stop(); if (animated) timer = setInterval(() => go(i + 1), 7000); };
    if (animated) {
      ScrollTrigger.create({ trigger: '.reviews', start: 'top 70%', end: 'bottom 30%', onToggle: self => self.isActive ? restart() : stop() });
      const stage = $('.reviews__stage');
      stage.addEventListener('mouseenter', stop);
      stage.addEventListener('mouseleave', restart);
    }
  }

  /* ------------------------------------------------------------------
     Formulaire de contact (démo : rien n'est envoyé)
  ------------------------------------------------------------------ */
  function initForm() {
    const form = $('#contactForm'), status = $('#formStatus');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#f-name'), email = $('#f-email');
      let ok = true;
      [name, email].forEach(f => f.closest('.field').classList.remove('is-invalid'));
      if (!name.value.trim()) { name.closest('.field').classList.add('is-invalid'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.closest('.field').classList.add('is-invalid'); ok = false; }
      if (!ok) {
        status.textContent = 'Indiquez votre nom et une adresse e-mail valide pour que nous puissions vous répondre.';
        if (hasGsap && !reduced) gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
        return;
      }
      const first = name.value.trim().split(' ')[0];
      status.textContent = `Merci ${first}, votre demande est enregistrée. Ceci est un site de démonstration : aucun message n'a été envoyé.`;
      if (hasGsap && !reduced) gsap.fromTo(status, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' });
      form.reset();
    });
  }

  /* ------------------------------------------------------------------
     Micro-interactions : boutons magnétiques
  ------------------------------------------------------------------ */
  function initMicro() {
    if (!fine) return;
    $$('.btn, .round').forEach(b => {
      const xTo = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'expo.out' });
      const yTo = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'expo.out' });
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }
})();
