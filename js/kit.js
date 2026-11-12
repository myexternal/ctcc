// Kit order: shirt number reservation (no duplicates), sizes, quantities.
import { CONFIG } from './config.js';
import { DEMO, money, esc, takenNumbers, placeOrder, demoBanner } from './forms.js';
import './page.js';

const K = CONFIG.kit;
const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const form = $('#kitForm'), board = $('#board'), numIn = $('#num'), nstat = $('#nstat'), autoBtn = $('#auto');
const sumNum = $('#sumNum'), sumNumNote = $('#sumNumNote'), sumName = $('#sumName'), sumItems = $('#sumItems'), sumTot = $('#sumTot');
const errEl = $('#err'), submit = $('#submit'), done = $('#done');

demoBanner($('#demo'));
let taken = new Set();
let pick = null;      // chosen number
let auto = false;     // "pick for me": the server assigns the lowest free number
const qty = Object.fromEntries(K.items.map((i) => [i.id, 0]));

/* ---------- number board ---------- */
const nums = []; for (let n = K.numberMin; n <= K.numberMax; n++) nums.push(n);
board.innerHTML = nums.map((n) => `<button type="button" data-n="${n}" aria-pressed="false">${n}</button>`).join('');
const btnOf = (n) => board.querySelector(`[data-n="${n}"]`);
const isFree = (n) => !taken.has(n) && !K.blocked.includes(n);
const lowestFree = () => nums.find(isFree) ?? null;
const nearestFree = (n) => { for (let d = 1; d < nums.length; d++) { if (isFree(n + d) && n + d <= K.numberMax) return n + d; if (n - d >= K.numberMin && isFree(n - d)) return n - d; } return null; };

function paintBoard() {
  board.querySelectorAll('button').forEach((b) => {
    const n = +b.dataset.n; const t = !isFree(n);
    b.disabled = t; b.setAttribute('aria-pressed', String(n === pick || (auto && n === lowestFree())));
    b.setAttribute('aria-label', `${n}${t ? ', taken' : ''}`);
  });
}
async function loadTaken() {
  board.classList.add('loading');
  try { taken = new Set(await takenNumbers()); }
  catch { nstat.className = 'nstat no'; nstat.textContent = "Couldn't load the taken numbers. Check your connection and reload."; }
  board.classList.remove('loading'); paintBoard(); status();
}

function setPick(n, from) {
  auto = false; autoBtn.setAttribute('aria-pressed', 'false');
  pick = n;
  if (from !== 'input') numIn.value = n ?? '';
  paintBoard(); status(); summary();
  if (n != null && !reduce) { const b = btnOf(n); b && b.animate([{ transform: 'scale(.86)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.23,1,.32,1)' }); }
}
function status(extra) {
  numIn.removeAttribute('aria-invalid');
  if (extra) { nstat.className = 'nstat no'; nstat.textContent = extra; return; }
  if (auto) { const l = lowestFree(); nstat.className = 'nstat ok'; nstat.textContent = l == null ? 'Sorry, every number is taken.' : `We'll reserve the lowest free number when you order: right now that's ${l}.`; return; }
  const raw = numIn.value.trim();
  if (!raw) { nstat.className = 'nstat'; nstat.textContent = ''; return; }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < K.numberMin || n > K.numberMax) { numIn.setAttribute('aria-invalid', 'true'); nstat.className = 'nstat no'; nstat.textContent = `Choose a number from ${K.numberMin} to ${K.numberMax}.`; return; }
  if (!isFree(n)) { const alt = nearestFree(n); numIn.setAttribute('aria-invalid', 'true'); nstat.className = 'nstat no'; nstat.textContent = `${n} is taken.${alt != null ? ` ${alt} is free.` : ''}`; return; }
  nstat.className = 'nstat ok'; nstat.textContent = `${n} is free.`;
}

board.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; const n = +b.dataset.n; setPick(pick === n ? null : n); });
numIn.addEventListener('input', () => {
  numIn.value = numIn.value.replace(/\D/g, '').slice(0, 2);
  const n = numIn.value === '' ? null : Number(numIn.value);
  pick = n != null && Number.isInteger(n) && n >= K.numberMin && n <= K.numberMax && isFree(n) ? n : null;
  auto = false; autoBtn.setAttribute('aria-pressed', 'false');
  paintBoard(); status(); summary();
});
autoBtn.addEventListener('click', () => {
  auto = !auto; autoBtn.setAttribute('aria-pressed', String(auto));
  if (auto) { pick = null; numIn.value = ''; }
  paintBoard(); status(); summary();
  const l = lowestFree(); if (auto && l != null) btnOf(l).scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
});

/* ---------- items ---------- */
$('#priceHint').textContent = CONFIG.PRICES_CONFIRMED ? 'Choose a size and how many you want.' : 'Prices are examples until the club confirms them.';
$('#items').innerHTML = K.items.map((it) => `
  <li class="item" data-id="${it.id}">
    <div class="in"><b>${esc(it.name)}</b>${it.note ? `<span>${esc(it.note)}</span>` : ''}<span class="pr">${money(it.price)}</span></div>
    ${it.sizes ? `<select class="sz" aria-label="${esc(it.name)} size"><option value="">Size</option>${K.sizes.map((s) => `<option>${s}</option>`).join('')}</select>` : '<span></span>'}
    <div class="stepper" role="group" aria-label="${esc(it.name)} quantity">
      <button type="button" data-d="-1" aria-label="One fewer" disabled>−</button><output aria-live="polite">0</output><button type="button" data-d="1" aria-label="One more">+</button>
    </div>
  </li>`).join('');
$('#items').addEventListener('click', (e) => {
  const b = e.target.closest('.stepper button'); if (!b) return;
  const li = b.closest('.item'); const id = li.dataset.id;
  qty[id] = Math.max(0, Math.min(K.maxQuantity, qty[id] + Number(b.dataset.d)));
  li.querySelector('output').textContent = qty[id];
  li.querySelector('[data-d="-1"]').disabled = qty[id] === 0;
  li.querySelector('[data-d="1"]').disabled = qty[id] === K.maxQuantity;
  const sz = li.querySelector('.sz'); if (sz && qty[id] > 0 && !sz.value && b.dataset.d === '1') sz.focus({ preventScroll: true });
  summary();
});
$('#items').addEventListener('change', (e) => { if (e.target.matches('.sz')) { e.target.removeAttribute('aria-invalid'); summary(); } });

$('#shirtName').addEventListener('input', (e) => { const v = e.target.value.toUpperCase().replace(/[^A-ZÅÄÖÜ .'\-]/g, '').slice(0, K.nameMaxLength); if (v !== e.target.value) e.target.value = v; summary(); });

/* ---------- summary ---------- */
function lines() {
  return K.items.filter((it) => qty[it.id] > 0).map((it) => {
    const li = $(`.item[data-id="${it.id}"]`); const size = it.sizes ? li.querySelector('.sz').value : '';
    return { id: it.id, name: it.name, size, qty: qty[it.id], total: it.price * qty[it.id] };
  });
}
function summary() {
  const shown = auto ? lowestFree() : pick;
  sumNum.textContent = shown ?? '–'; sumNum.classList.toggle('empty', shown == null);
  sumNumNote.textContent = auto ? 'Lowest free number, reserved when you order' : pick != null ? 'Reserved for you when you order' : 'Choose a number';
  sumName.textContent = $('#shirtName').value;
  const L = lines();
  sumItems.innerHTML = L.length ? L.map((l) => `<li><span>${l.qty} × ${esc(l.name)}${l.size ? ` <span style="opacity:.6">${l.size}</span>` : ''}</span><span class="num">${money(l.total)}</span></li>`).join('') : '<li class="none">No items yet</li>';
  sumTot.textContent = money(L.reduce((a, l) => a + l.total, 0));
  $('#sumEx').textContent = CONFIG.PRICES_CONFIRMED ? "We'll confirm your order by email before you pay." : 'Example prices. The club confirms the order and the price by email before you pay.';
  submit.textContent = shown != null ? `Reserve ${shown} and order` : 'Reserve and order';
}

/* ---------- submit ---------- */
const showErr = (m) => { errEl.textContent = m; errEl.hidden = !m; };
function check() {
  let first = null; const bad = (el, m) => { el.setAttribute('aria-invalid', 'true'); const msg = el.parentElement.querySelector('.msg'); if (msg) msg.textContent = m; first = first || el; };
  form.querySelectorAll('[aria-invalid]').forEach((el) => { el.removeAttribute('aria-invalid'); const m = el.parentElement.querySelector('.msg'); if (m) m.textContent = ''; });
  const name = form.elements.name.value.trim(), email = form.email.value.trim();
  if (!name) bad(form.elements.name, 'Please add your name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) bad(form.email, 'Please check your email address.');
  if (first) return { el: first, m: 'Please fill in your details.' };
  if (!auto && pick == null) return { el: numIn, m: 'Choose a shirt number, or tap "Pick a free number for me".' };
  const L = lines(); if (!L.length) return { el: $('#items .stepper button[data-d="1"]'), m: 'Add at least one item.' };
  const noSize = K.items.find((it) => it.sizes && qty[it.id] > 0 && !$(`.item[data-id="${it.id}"] .sz`).value);
  if (noSize) { const s = $(`.item[data-id="${noSize.id}"] .sz`); s.setAttribute('aria-invalid', 'true'); return { el: s, m: `Choose a size for the ${noSize.name.toLowerCase()}.` }; }
  return null;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault(); showErr('');
  const c = check(); if (c) { showErr(c.m); c.el.focus(); c.el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); return; }
  submit.classList.add('busy'); submit.disabled = true;
  const payload = {
    name: form.elements.name.value.trim(), email: form.email.value.trim(), phone: form.phone.value.trim(),
    number: auto ? null : pick, shirtName: $('#shirtName').value.trim(), notes: form.notes.value.trim(), website: form.website.value,
    items: lines().map(({ id, size, qty: q }) => ({ id, size, qty: q })),
  };
  let r;
  try { r = await placeOrder(payload); } catch { r = { ok: false, error: 'network' }; }
  submit.classList.remove('busy'); submit.disabled = false;
  if (r.ok) return success(r, payload);
  if (r.error === 'taken') { taken.add(r.number); setPick(null); await loadTaken(); showErr(`Sorry, someone has just reserved ${r.number}. Pick another number.`); status(`${r.number} was just taken.`); numIn.focus(); return; }
  if (r.error === 'has_number') { setPick(r.number); showErr(`You already have number ${r.number} with this email, so we've switched your order to ${r.number}. Send it again, or email ${CONFIG.contactEmail} to change numbers.`); return; }
  if (r.error === 'none_free') return showErr(`Every number is taken. Email ${CONFIG.contactEmail} and we'll sort it out.`);
  if (r.error === 'busy') return showErr('Lots of orders at once. Wait a few seconds and send it again.');
  showErr(`Your order didn't go through. Check your connection and try again, or email ${CONFIG.contactEmail}.`);
});

function success(r, p) {
  const L = lines(); const total = r.total ?? L.reduce((a, l) => a + l.total, 0);
  form.hidden = true; done.hidden = false;
  done.innerHTML = `
    <span class="lbl">${DEMO ? 'Demo order saved in this browser' : 'Order received'}</span>
    <h2><b>Number ${r.number}</b>is yours.</h2>
    <p class="lead">Thanks, ${esc(p.name.split(' ')[0])}. Nobody else can reserve ${r.number} now. ${DEMO ? 'In the live version you would get a copy by email.' : `We've sent a copy to ${esc(p.email)}.`} The club will confirm your order and how to pay before it goes to the kit maker.</p>
    <dl class="facts num">
      <div><dt class="lbl">Order</dt><dd>${esc(r.orderId)}</dd></div>
      <div><dt class="lbl">Shirt number</dt><dd>${r.number}${p.shirtName ? ` · ${esc(p.shirtName)}` : ''}</dd></div>
      <div><dt class="lbl">Total${CONFIG.PRICES_CONFIRMED ? '' : ' (example)'}</dt><dd>${money(total)}</dd></div>
    </dl>
    <ul class="incl">${L.map((l) => `<li>${l.qty} × ${esc(l.name)}${l.size ? `, size ${l.size}` : ''}</li>`).join('')}</ul>
    <div class="again"><a class="btn btn-gold" href="kit.html">Order for someone else</a><a class="btn btn-line" href="join.html">Become a member <span class="arr" aria-hidden="true">→</span></a></div>`;
  done.focus({ preventScroll: true });
  done.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
}

summary(); loadTaken();
