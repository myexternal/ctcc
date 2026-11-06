// Ceylon Tampere CC — page behaviour (reveals, rail, sheet, photo reveal, ball picker)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// one scroll listener, one rAF per frame, shared by every scroll-linked effect
const onScroll = []; let ticking = false;
addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; onScroll.forEach((f) => f()); }); }, { passive: true });
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- reveals (once) ---------- */
const io = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
$$('.rv').forEach((el) => io.observe(el));

/* ---------- desktop rail: active section + sliding marker ---------- */
const rail = $('.rail');
if (rail) {
  const links = $$('ol a', rail);
  const mark = $('.mark', rail);
  const secs = links.map((a) => document.getElementById(a.dataset.sec)).filter(Boolean);
  let current = null;
  const setActive = (id) => {
    if (id === current) return;
    current = id;
    links.forEach((a) => a.setAttribute('aria-current', a.dataset.sec === id ? 'true' : 'false'));
    const a = links.find((l) => l.dataset.sec === id);
    if (a) { mark.style.height = a.offsetHeight * 0.5 + 'px'; mark.style.transform = `translateY(${a.parentElement.offsetTop + a.offsetHeight * 0.25}px)`; }
    else { mark.style.height = '0px'; }
  };
  const pick = () => {
    const mid = innerHeight * 0.45; let id = null;
    for (const s of secs) { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) id = s.id; }
    setActive(id);
  };
  onScroll.push(pick);
  addEventListener('resize', pick); pick();
}

/* ---------- phone menu: bottom sheet, drag to dismiss with velocity ---------- */
const sheet = $('#sheet'), menuBtn = $('.menu-btn');
if (sheet && menuBtn) {
  let lastFocus = null;
  const open = () => {
    lastFocus = document.activeElement; sheet.hidden = false; void sheet.offsetHeight;
    requestAnimationFrame(() => { document.body.classList.add('sheet-open'); menuBtn.setAttribute('aria-expanded', 'true'); $('a', sheet).focus({ preventScroll: true }); });
  };
  const close = () => {
    document.body.classList.remove('sheet-open'); menuBtn.setAttribute('aria-expanded', 'false');
    sheet.style.transform = ''; sheet.style.transition = '';
    setTimeout(() => { if (!document.body.classList.contains('sheet-open')) sheet.hidden = true; }, 440);
    lastFocus && lastFocus.focus({ preventScroll: true });
  };
  menuBtn.addEventListener('click', open);
  $('.scrim').addEventListener('click', close);
  $$('a', sheet).forEach((a) => a.addEventListener('click', () => close()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('sheet-open')) close(); });

  // drag: 1:1 tracking, rubber-band upward, flick or distance to dismiss
  let y0 = 0, dy = 0, t0 = 0, drag = false, hist = [];
  sheet.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button') && e.pointerType === 'mouse') return;
    drag = true; y0 = e.clientY; dy = 0; t0 = performance.now(); hist = [{ y: y0, t: t0 }];
    sheet.setPointerCapture(e.pointerId); sheet.style.transition = 'none';
  });
  sheet.addEventListener('pointermove', (e) => {
    if (!drag) return;
    dy = e.clientY - y0; const t = performance.now(); hist.push({ y: e.clientY, t }); if (hist.length > 6) hist.shift();
    const v = dy < 0 ? -(Math.abs(dy) * 60) / (60 + Math.abs(dy)) : dy; // rubber-band above rest
    sheet.style.transform = `translateY(${v}px)`;
  });
  const end = (e) => {
    if (!drag) return; drag = false; sheet.style.transition = '';
    const a = hist[0], b = hist[hist.length - 1]; const vel = (b.y - a.y) / Math.max(1, b.t - a.t); // px/ms
    if (Math.abs(dy) < 6) { sheet.style.transform = ''; return; }
    if (dy > sheet.offsetHeight * 0.3 || vel > 0.5) close(); else sheet.style.transform = '';
  };
  sheet.addEventListener('pointerup', end); sheet.addEventListener('pointercancel', end);
}

/* ---------- team photo: opens from an inset frame as it scrolls in ---------- */
const photo = $('#teamPhoto');
if (photo && !reduce) {
  const img = $('img', photo);
  const upd = () => {
    const r = photo.getBoundingClientRect(); const vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)));
    const e = 1 - Math.pow(1 - p, 3);
    const ix = (1 - e) * 9, iy = (1 - e) * 7, rad = (1 - e) * 28;
    photo.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${rad}px)`;
    img.style.transform = `scale(${1.12 - e * 0.12})`;
  };
  onScroll.push(upd); upd();
}

/* ---------- trophy: slow parallax inside its frame ---------- */
const trophy = $('#trophyImg');
if (trophy && !reduce) {
  const upd = () => {
    const r = trophy.parentElement.getBoundingClientRect(); const vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
    trophy.style.transform = `scale(1.08) translateY(${p * -4}%)`;
  };
  onScroll.push(upd); upd();
}

/* ---------- ball picker ---------- */
const balls = [
  { src: 'media/ball-leather.webp', alt: 'A red leather cricket ball', lbl: 'The leather ball', txt: 'Our league cricket. We play the Cricket Finland T20 National League, and step up to Division 4 in 2027.' },
  { src: 'media/ball-maruti.webp', alt: 'A red hard tennis ball', lbl: 'The red hard tennis ball', txt: 'Maruti ball matches, played with the red hard tennis ball. We play these as a team too.' },
  { src: 'media/ball-tennis.webp', alt: 'A yellow tennis ball', lbl: 'The tennis ball', txt: 'Tennis ball cricket: quick to start, and open to everyone.' },
];
balls.forEach((b) => { const i = new Image(); i.src = b.src; }); // warm cache
const picks = $$('.pick'), bImg = $('#ballImg'), bLbl = $('#ballLbl'), bTxt = $('#ballTxt'), panel = $('#ballPanel');
let sel = 0, anim = null;
const choose = (i, focus) => {
  if (i === sel) return; const dir = i > sel ? 1 : -1; sel = i;
  picks.forEach((p, k) => { p.setAttribute('aria-selected', k === i ? 'true' : 'false'); p.tabIndex = k === i ? 0 : -1; });
  if (focus) picks[i].focus();
  panel.setAttribute('aria-labelledby', picks[i].id);
  const b = balls[i];
  // the ball rolls in from the side it's coming from; interruptible because we start from the live state
  anim && anim.cancel();
  bImg.src = b.src; bImg.alt = b.alt; bLbl.textContent = b.lbl; bTxt.textContent = b.txt;
  if (!reduce) {
    anim = bImg.animate([
      { transform: `translateX(${dir * 18}%) rotate(${dir * 120}deg) scale(.92)`, opacity: 0, filter: 'blur(4px)' },
      { transform: 'translateX(0) rotate(0deg) scale(1)', opacity: 1, filter: 'blur(0)' },
    ], { duration: 620, easing: 'cubic-bezier(.23,1,.32,1)' });
    bTxt.parentElement.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.23,1,.32,1)' });
  }
};
picks.forEach((p, k) => {
  p.addEventListener('click', () => choose(k));
  p.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); choose((sel + 1) % 3, true); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); choose((sel + 2) % 3, true); }
  });
});

/* ---------- big numerals count up once ---------- */
if (!reduce) {
  const cio = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue; cio.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, t0 = performance.now(), d = 1100;
      const step = (t) => { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
      el.style.display = 'inline-block'; el.style.minWidth = el.offsetWidth + 'px'; el.textContent = '0'; requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => cio.observe(el));
}
