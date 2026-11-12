/**
 * Ceylon Tampere CC: kit orders and membership.
 * A Google Apps Script web app that saves to the Google Sheet it's attached to.
 * Setup steps are in SETUP.md. Keep the settings below in step with js/config.js.
 */

const SETTINGS = {
  SEASON: 2027,
  NUMBER_MIN: 1,
  NUMBER_MAX: 99,
  BLOCKED: [],                       // numbers nobody can reserve
  NOTIFY: 'ceylontamperecricket@gmail.com', // gets an email for every order and new member
  SEND_CONFIRMATIONS: true,          // email the person a copy
  // Prices and fees: the server works out totals itself, so nobody can change them in the browser.
  ITEMS: { shirt: 35, shirt_ls: 40, trousers: 30, cap: 15, training: 20 },
  ITEM_NAMES: { shirt: 'Playing shirt', shirt_ls: 'Playing shirt, long sleeve', trousers: 'Playing trousers', cap: 'Cap', training: 'Training T-shirt' },
  TIERS: { player: 120, student: 80, supporter: 25 },
  TIER_NAMES: { player: 'Playing member', student: 'Student player', supporter: 'Supporter' },
  MAX_QTY: 5,
};

const SHEETS = {
  Numbers: ['Number', 'Name', 'Email', 'Reserved at', 'Order ID'],
  Orders: ['Order ID', 'Time', 'Name', 'Email', 'Phone', 'Number', 'Name on shirt', 'Items', 'Total €', 'Reference', 'Paid', 'Notes'],
  Members: ['Member ID', 'Time', 'Name', 'Email', 'Phone', 'Birth year', 'Membership', 'Fee €', 'Reference', 'Experience', 'Role', 'Paid', 'Notes'],
};

/* ---------- entry points ---------- */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'numbers') return json({ ok: true, taken: takenList_() });
  return json({ ok: true, service: 'CTCC forms' });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'bad_request' }); }
  if (body.website) return json({ ok: true }); // honeypot: bots fill the hidden field
  try {
    if (body.action === 'order') return json(order_(body));
    if (body.action === 'member') return json(member_(body));
    return json({ ok: false, error: 'unknown_action' });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server', message: String(err) });
  }
}

/* ---------- kit order with a unique shirt number ---------- */
function order_(b) {
  const name = clean_(b.name, 80), email = clean_(b.email, 120).toLowerCase(), phone = clean_(b.phone, 40);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'invalid' };

  const lines = []; let total = 0;
  (b.items || []).forEach(function (it) {
    const price = SETTINGS.ITEMS[it.id]; const qty = Math.floor(Number(it.qty));
    if (price == null || !(qty > 0)) return;
    const q = Math.min(qty, SETTINGS.MAX_QTY);
    total += price * q;
    lines.push(q + ' × ' + SETTINGS.ITEM_NAMES[it.id] + (it.size ? ' (' + clean_(it.size, 6) + ')' : ''));
  });
  if (!lines.length) return { ok: false, error: 'no_items' };

  // One person at a time from here, so two people can never get the same number.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, error: 'busy' };
  try {
    const sh = sheet_('Numbers');
    const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues() : [];
    const owner = {}; rows.forEach(function (r) { if (r[0] !== '') owner[Number(r[0])] = String(r[2]).toLowerCase() || '(reserved by the club)'; });

    const mine = Object.keys(owner).filter(function (n) { return owner[n] === email; })[0];
    let n = b.number == null || b.number === '' ? null : Math.floor(Number(b.number));

    if (mine != null && n != null && Number(mine) !== n) return { ok: false, error: 'has_number', number: Number(mine) };
    if (mine != null && n == null) n = Number(mine);
    if (n == null) {
      for (let k = SETTINGS.NUMBER_MIN; k <= SETTINGS.NUMBER_MAX; k++) if (!(k in owner) && SETTINGS.BLOCKED.indexOf(k) < 0) { n = k; break; }
      if (n == null) return { ok: false, error: 'none_free' };
    }
    if (!(n >= SETTINGS.NUMBER_MIN && n <= SETTINGS.NUMBER_MAX)) return { ok: false, error: 'invalid_number' };
    if (SETTINGS.BLOCKED.indexOf(n) >= 0 || (owner[n] && owner[n] !== email)) return { ok: false, error: 'taken', number: n };

    const seq = nextSeq_('order');
    const orderId = 'K' + yy_() + '-' + pad_(seq);
    const ref = viite_(yy_() + '2' + pad_(seq));
    if (mine == null) sh.appendRow([n, name, email, new Date(), orderId]);
    sheet_('Orders').appendRow([orderId, new Date(), name, email, phone, n, clean_(b.shirtName, 14).toUpperCase(), lines.join('\n'), total, ref, '', clean_(b.notes, 500)]);
    SpreadsheetApp.flush();

    notify_('Kit order ' + orderId + ': #' + n + ' for ' + name,
      name + ' (' + email + (phone ? ', ' + phone : '') + ')\nNumber: ' + n + (b.shirtName ? '\nName on shirt: ' + b.shirtName : '') + '\n\n' + lines.join('\n') + '\n\nTotal: ' + total + ' €\nReference: ' + ref + (b.notes ? '\n\nNotes: ' + b.notes : ''),
      email, 'Your CTCC kit order ' + orderId,
      'Hi ' + name.split(' ')[0] + ',\n\nThanks for your kit order. Shirt number ' + n + ' is reserved for you.\n\n' + lines.join('\n') + '\nTotal: ' + total + ' €\nReference: ' + ref + '\n\nWe will confirm the order and how to pay before it goes to the kit maker.\n\nCeylon Tampere Cricket Club');
    return { ok: true, orderId: orderId, number: n, ref: ref, total: total };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- membership ---------- */
function member_(b) {
  const name = clean_(b.name, 80), email = clean_(b.email, 120).toLowerCase();
  const fee = SETTINGS.TIERS[b.tier];
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || fee == null) return { ok: false, error: 'invalid' };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, error: 'busy' };
  try {
    const sh = sheet_('Members');
    const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 9).getValues() : [];
    const prev = rows.filter(function (r) { return String(r[3]).toLowerCase() === email; })[0];
    if (prev) {
      const tierId = Object.keys(SETTINGS.TIER_NAMES).filter(function (k) { return SETTINGS.TIER_NAMES[k] === prev[6]; })[0] || b.tier;
      return { ok: true, again: true, memberId: prev[0], ref: String(prev[8]), tier: tierId, fee: Number(prev[7]) };
    }

    const seq = nextSeq_('member');
    const memberId = 'M' + yy_() + '-' + pad_(seq);
    const ref = viite_(yy_() + '1' + pad_(seq));
    sh.appendRow([memberId, new Date(), name, email, clean_(b.phone, 40), clean_(b.birthYear, 4), SETTINGS.TIER_NAMES[b.tier], fee, ref, clean_(b.experience, 40), clean_(b.role, 40), '', clean_(b.notes, 500)]);
    SpreadsheetApp.flush();

    notify_('New member ' + memberId + ': ' + name + ' (' + SETTINGS.TIER_NAMES[b.tier] + ')',
      name + ' (' + email + ')\n' + SETTINGS.TIER_NAMES[b.tier] + ', ' + fee + ' €\nReference: ' + ref,
      email, 'Welcome to Ceylon Tampere CC (' + memberId + ')',
      'Hi ' + name.split(' ')[0] + ',\n\nThanks for joining Ceylon Tampere Cricket Club for ' + SETTINGS.SEASON + '.\n\nMembership: ' + SETTINGS.TIER_NAMES[b.tier] + '\nFee: ' + fee + ' €\nMember ID: ' + memberId + '\nReference number: ' + ref + '\n\nPlease use the reference number when you pay. See you in January.\n\nCeylon Tampere Cricket Club');
    return { ok: true, memberId: memberId, ref: ref, tier: b.tier, fee: fee };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- helpers ---------- */
function takenList_() {
  const sh = sheet_('Numbers');
  const vals = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues() : [];
  const out = vals.map(function (r) { return Number(r[0]); }).filter(function (n) { return n > 0 || n === 0; });
  return out.concat(SETTINGS.BLOCKED); // only numbers go out, never names or emails
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(SHEETS[name]); sh.setFrozenRows(1); sh.getRange(1, 1, 1, SHEETS[name].length).setFontWeight('bold'); }
  return sh;
}

function nextSeq_(key) {
  const props = PropertiesService.getScriptProperties();
  const n = Number(props.getProperty('seq_' + key) || 0) + 1;
  props.setProperty('seq_' + key, String(n));
  return n;
}

// Finnish bank reference number: weights 7, 3, 1 from the right.
function viite_(base) {
  const d = String(base).replace(/\D/g, ''); const w = [7, 3, 1]; let s = 0;
  for (let i = 0; i < d.length; i++) s += Number(d.charAt(d.length - 1 - i)) * w[i % 3];
  return d + ((10 - (s % 10)) % 10);
}

function notify_(subject, body, to, toSubject, toBody) {
  try {
    if (SETTINGS.NOTIFY) MailApp.sendEmail(SETTINGS.NOTIFY, subject, body);
    if (SETTINGS.SEND_CONFIRMATIONS && to) MailApp.sendEmail(to, toSubject, toBody, { replyTo: SETTINGS.NOTIFY, name: 'Ceylon Tampere Cricket Club' });
  } catch (err) { console.error('mail failed', err); } // a failed email never loses the order
}

function clean_(v, max) {
  const s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s; // stop text from running as a spreadsheet formula
}
function pad_(n) { return ('0000' + n).slice(-4); }
function yy_() { return String(SETTINGS.SEASON).slice(-2); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Run once from the editor to create the three tabs and grant permissions.
function setup() { Object.keys(SHEETS).forEach(sheet_); }
