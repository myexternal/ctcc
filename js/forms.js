// Shared form plumbing: talks to the club's Google Apps Script, or runs a
// browser-only demo when no SCRIPT_URL is set in config.js.
import { CONFIG } from './config.js';

export const DEMO = !CONFIG.SCRIPT_URL;
export const money = (n) => (n == null ? '–' : `${Number(n).toLocaleString('fi-FI', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} ${CONFIG.currency}`);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Finnish bank reference number (viitenumero): weights 7,3,1 from the right.
export function viite(base) {
  const d = String(base).replace(/\D/g, '');
  const w = [7, 3, 1]; let s = 0;
  for (let i = 0; i < d.length; i++) s += Number(d[d.length - 1 - i]) * w[i % 3];
  return d + ((10 - (s % 10)) % 10);
}
export const viiteGroups = (r) => String(r).replace(/(\d)(?=(\d{5})+$)/g, '$1 ');

/* ---------- live backend ---------- */
async function call(body) {
  // text/plain keeps this a "simple" request, so the browser doesn't need a CORS preflight.
  const res = await fetch(CONFIG.SCRIPT_URL, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/* ---------- demo backend (this browser only) ---------- */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('ctcc_demo_' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ctcc_demo_' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const demoSeed = () => { const n = store.get('numbers', null); if (n) return n; const s = { 7: 'demo', 10: 'demo', 18: 'demo', 45: 'demo' }; store.set('numbers', s); return s; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nextSeq = (k) => { const n = store.get('seq_' + k, 0) + 1; store.set('seq_' + k, n); return n; };
const yy = String(CONFIG.season).slice(-2);

function lowestFree(taken) {
  const { numberMin, numberMax, blocked } = CONFIG.kit;
  for (let n = numberMin; n <= numberMax; n++) if (!taken.has(n) && !blocked.includes(n)) return n;
  return null;
}

/* ---------- public API ---------- */
export async function takenNumbers() {
  if (DEMO) { await wait(250); return Object.keys(demoSeed()).map(Number); }
  const res = await fetch(CONFIG.SCRIPT_URL + '?action=numbers', { redirect: 'follow' });
  const j = await res.json(); if (!j.ok) throw new Error(j.error || 'failed');
  return j.taken;
}

// order: { name, email, phone, number|null (null = pick for me), shirtName, items:[{id,size,qty}], notes, website(honeypot) }
export async function placeOrder(order) {
  if (!DEMO) return call({ action: 'order', ...order });
  await wait(600);
  const nums = demoSeed(); const email = order.email.trim().toLowerCase();
  const mine = Object.entries(nums).find(([, e]) => e === email);
  let n = order.number;
  if (mine && n != null && Number(mine[0]) !== n) return { ok: false, error: 'has_number', number: Number(mine[0]) };
  if (mine && n == null) n = Number(mine[0]);
  if (n == null) n = lowestFree(new Set(Object.keys(nums).map(Number)));
  if (n == null) return { ok: false, error: 'none_free' };
  if (nums[n] && nums[n] !== email) return { ok: false, error: 'taken', number: n };
  if (CONFIG.kit.blocked.includes(n)) return { ok: false, error: 'taken', number: n };
  nums[n] = email; store.set('numbers', nums);
  const seq = nextSeq('order');
  const orders = store.get('orders', []); orders.push({ ...order, number: n, at: new Date().toISOString() }); store.set('orders', orders);
  return { ok: true, orderId: `K${yy}-${String(seq).padStart(4, '0')}`, number: n, ref: viite(`${yy}2${String(seq).padStart(4, '0')}`) };
}

// member: { name, email, phone, birthYear, tier, experience, role, notes, website(honeypot) }
export async function joinClub(member) {
  if (!DEMO) return call({ action: 'member', ...member });
  await wait(600);
  const list = store.get('members', []); const email = member.email.trim().toLowerCase();
  const prev = list.find((m) => m.email === email);
  if (prev) return { ok: true, again: true, memberId: prev.memberId, ref: prev.ref, tier: prev.tier };
  const seq = nextSeq('member');
  const memberId = `M${yy}-${String(seq).padStart(4, '0')}`;
  const ref = viite(`${yy}1${String(seq).padStart(4, '0')}`);
  list.push({ ...member, email, memberId, ref, at: new Date().toISOString() }); store.set('members', list);
  return { ok: true, memberId, ref, tier: member.tier };
}

export function resetDemo() { ['numbers', 'orders', 'members', 'seq_order', 'seq_member'].forEach((k) => { try { localStorage.removeItem('ctcc_demo_' + k); } catch {} }); }

/* ---------- payment block (membership and kit) ---------- */
export function paymentHTML({ amount, ref, tierId, memberId, email, label }) {
  const p = CONFIG.payment; const out = [];
  const stripe = tierId && p.stripe[tierId];
  if (stripe) {
    const u = new URL(stripe); u.searchParams.set('client_reference_id', memberId || ref); if (email) u.searchParams.set('prefilled_email', email);
    out.push(`<div class="pay-opt"><span class="lbl">Card, Apple Pay, Google Pay</span><a class="btn btn-gold" href="${esc(u.href)}" target="_blank" rel="noopener">Pay ${money(amount)} now <span class="arr" aria-hidden="true">↗</span></a></div>`);
  }
  if (p.bank.iban) {
    out.push(`<div class="pay-opt"><span class="lbl">Bank transfer</span><dl class="paydl num">
      <dt>Recipient</dt><dd>${esc(p.bank.recipient || 'Ceylon Tampere Cricket Club')}</dd>
      <dt>IBAN</dt><dd><button type="button" class="copy" data-copy="${esc(p.bank.iban.replace(/\s/g, ''))}">${esc(p.bank.iban)}</button></dd>
      ${p.bank.bic ? `<dt>BIC</dt><dd>${esc(p.bank.bic)}</dd>` : ''}
      <dt>Reference</dt><dd><button type="button" class="copy" data-copy="${esc(ref)}">${viiteGroups(ref)}</button></dd>
      <dt>Amount</dt><dd>${money(amount)}</dd>
      <dt>Due</dt><dd>within ${p.dueDays} days</dd></dl></div>`);
  }
  if (p.mobilepay.number) {
    out.push(`<div class="pay-opt"><span class="lbl">MobilePay</span><p>Pay ${money(amount)} to <b class="num">${esc(p.mobilepay.number)}</b> and write <b class="num">${esc(memberId || ref)}</b> in the message.</p></div>`);
  }
  if (!out.length) {
    out.push(DEMO
      ? `<div class="pay-opt todo"><span class="lbl">Payment options go here</span><p>Bank transfer with this reference number, MobilePay, and card payment through Stripe. They appear as soon as the club adds its details to <code>js/config.js</code>.</p></div>`
      : `<div class="pay-opt"><p>We'll email you how to pay ${label || ''}. Your reference number is <b class="num">${viiteGroups(ref)}</b>.</p></div>`);
  }
  return out.join('');
}

// tap-to-copy for IBAN and reference
document.addEventListener('click', async (e) => {
  const b = e.target.closest('.copy'); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copy); b.classList.add('ok'); setTimeout(() => b.classList.remove('ok'), 1400); } catch { /* clipboard blocked */ }
});

export function demoBanner(el) {
  if (!DEMO || !el) return;
  el.hidden = false;
  el.innerHTML = `<b>Demo mode.</b> This form isn't connected to the club's sheet yet, so anything sent here stays in this browser only. <button type="button" class="tlink" data-reset>Reset demo</button>`;
  el.querySelector('[data-reset]').addEventListener('click', () => { resetDemo(); location.reload(); });
}
