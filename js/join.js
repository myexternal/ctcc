// Membership sign-up and fee payment.
import { CONFIG } from './config.js';
import { DEMO, money, esc, joinClub, paymentHTML, viiteGroups, demoBanner } from './forms.js';
import './page.js';

const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const form = $('#joinForm'), errEl = $('#err'), submit = $('#submit'), done = $('#done');
const T = CONFIG.membership.tiers;
demoBanner($('#demo'));

$('#feeHint').textContent = CONFIG.PRICES_CONFIRMED ? `Fees are for the ${CONFIG.season} season.` : 'Fees are examples until the club confirms them.';
$('#tiers').innerHTML = T.map((t, i) => `
  <label class="tier"><input type="radio" name="tier" value="${t.id}"${i === 0 ? ' checked' : ''}>
    <span class="tn">${esc(t.name)}</span><span class="tf num">${money(t.fee)}<small>/ season</small></span><span class="td">${esc(t.note)}</span></label>`).join('');

const tier = () => T.find((t) => t.id === form.tier.value) || T[0];
function summary() {
  const t = tier();
  $('#sTier').textContent = t.name; $('#sFee').textContent = money(t.fee);
  $('#sEx').textContent = CONFIG.PRICES_CONFIRMED ? `${CONFIG.season} season` : `${CONFIG.season} season · example fee`;
  const playing = t.id !== 'supporter';
  $('#playStep').hidden = !playing; $('#lastStep').textContent = playing ? 'Step 4' : 'Step 3';
  submit.textContent = `Sign up · ${money(t.fee)}`;
}
form.addEventListener('change', (e) => { if (e.target.name === 'tier') summary(); });
form.birthYear.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });

const showErr = (m) => { errEl.textContent = m; errEl.hidden = !m; };
function check() {
  let first = null; const bad = (el, m) => { el.setAttribute('aria-invalid', 'true'); const msg = el.parentElement.querySelector('.msg'); if (msg) msg.textContent = m; first = first || el; };
  form.querySelectorAll('[aria-invalid]').forEach((el) => { el.removeAttribute('aria-invalid'); const m = el.parentElement.querySelector('.msg'); if (m) m.textContent = ''; });
  if (!form.elements.name.value.trim()) bad(form.elements.name, 'Please add your name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.value.trim())) bad(form.email, 'Please check your email address.');
  const y = form.birthYear.value; const now = new Date().getFullYear();
  if (y && (y.length !== 4 || +y < now - 100 || +y > now - 5)) bad(form.birthYear, 'Please check the year.');
  if (first) return { el: first, m: 'Please check your details.' };
  if (!form.consent.checked) return { el: form.consent, m: 'Please tick the box to agree to the member register.' };
  return null;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault(); showErr('');
  const c = check(); if (c) { showErr(c.m); c.el.focus(); c.el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); return; }
  const t = tier(); const playing = t.id !== 'supporter';
  const payload = {
    tier: t.id, name: form.elements.name.value.trim(), email: form.email.value.trim(), phone: form.phone.value.trim(), birthYear: form.birthYear.value,
    experience: playing ? (form.experience.value || '') : '', role: playing ? (form.role.value || '') : '', notes: form.notes.value.trim(), website: form.website.value,
  };
  submit.classList.add('busy'); submit.disabled = true;
  let r; try { r = await joinClub(payload); } catch { r = { ok: false, error: 'network' }; }
  submit.classList.remove('busy'); submit.disabled = false;
  if (!r.ok) return showErr(r.error === 'busy' ? 'Lots of sign-ups at once. Wait a few seconds and try again.' : `Your sign-up didn't go through. Check your connection and try again, or email ${CONFIG.contactEmail}.`);
  const tt = T.find((x) => x.id === r.tier) || t; const fee = r.fee ?? tt.fee;
  form.hidden = true; done.hidden = false;
  done.innerHTML = `
    <span class="lbl">${DEMO ? 'Demo sign-up saved in this browser' : r.again ? 'You were already signed up' : 'Welcome to the club'}</span>
    <h2><b>Welcome,</b>${esc(payload.name.split(' ')[0])}.</h2>
    <p class="lead">${r.again ? 'This email is already on our member list, so here are your details again.' : `You're signed up as a ${esc(tt.name.toLowerCase())} for ${CONFIG.season}.`} ${DEMO ? 'In the live version you would get these details by email too.' : `We've emailed the details to ${esc(payload.email)}.`} Pay the fee below to complete your membership.</p>
    <dl class="facts num">
      <div><dt class="lbl">Member ID</dt><dd>${esc(r.memberId)}</dd></div>
      <div><dt class="lbl">Fee${CONFIG.PRICES_CONFIRMED ? '' : ' (example)'}</dt><dd>${money(fee)}</dd></div>
      <div><dt class="lbl">Reference number</dt><dd>${viiteGroups(r.ref)}</dd></div>
    </dl>
    <div class="pays">${paymentHTML({ amount: fee, ref: r.ref, tierId: tt.id, memberId: r.memberId, email: payload.email, label: 'the fee' })}</div>
    <div class="again"><a class="btn btn-gold" href="kit.html">Order your kit <span class="arr" aria-hidden="true">→</span></a><a class="btn btn-line" href="index.html">Back to home</a></div>`;
  done.focus({ preventScroll: true });
  done.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
});
summary();
