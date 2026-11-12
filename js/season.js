// Season 2026 page: reveals + sortable bowling table
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// [name, matches, innings, overs, runs, wickets, best, economy]
const rows = [
  ['Yohan Perera', 5, 5, '20', 101, 15, '5/21', 5.05],
  ['Mohamed Aashif Mohamed Masees', 9, 9, '29.3', 164, 11, '3/13', 5.56],
  ['Srimal Shirantha Gajaman Arachchige', 10, 10, '29.3', 181, 11, '3/17', 6.14],
  ['Yasantha Bandara', 9, 8, '25', 163, 11, '4/18', 6.52],
  ['Chirantha Kumara Athapaththu', 4, 4, '12', 73, 7, '2/12', 6.08],
  ['Oshintha Sandaruwan', 9, 7, '19.3', 127, 7, '2/22', 6.51],
  ['Yasintha Anuranga Kodippili', 7, 7, '19.5', 148, 6, '2/15', 7.46],
  ['Sharada Prabhashwara Jayaweera', 2, 2, '2', 11, 2, '1/2', 5.50],
  ['Gayan Samarathunga', 3, 3, '4.4', 32, 2, '2/2', 6.86],
  ['Gayan Madhushanka Jayamal Ambalanduwa Kankanamge', 2, 2, '3', 39, 2, '2/5', 13.00],
  ['Yohan Shanaka Fernando', 8, 1, '0.5', 4, 1, '1/4', 4.80],
  ['Thishan Thanushka Jayawardena', 4, 3, '4', 35, 1, '–', 8.75],
  ['Thushan De Zoysa', 10, 1, '2', 13, 0, '–', 6.50],
  ['Nipun Neerodhana Rodrigo', 3, 2, '3', 40, 0, '–', 13.33],
  ['Anuruddha Dananjaya De Silva', 3, 1, '2', 27, 0, '–', 13.50],
  ['Charuka Janith', 2, 1, '1', 16, 0, '–', 16.00],
].map((r, i) => ({ rank: i + 1, name: r[0], m: r[1], inn: r[2], ov: r[3], r: r[4], w: r[5], best: r[6], econ: r[7] }));

const balls = (ov) => { const [o, b = 0] = ov.split('.').map(Number); return o * 6 + b; };
const bestKey = (b) => { if (b === '–') return -1; const [w, r] = b.split('/').map(Number); return w * 1000 - r; };
const keyOf = { rank: (x) => x.rank, name: (x) => x.name, m: (x) => x.m, inn: (x) => x.inn, ov: (x) => balls(x.ov), r: (x) => x.r, w: (x) => x.w, best: (x) => bestKey(x.best), econ: (x) => x.econ };

const tbody = document.querySelector('#bowl tbody');
const btns = [...document.querySelectorAll('#bowl thead button')];
let sortK = 'rank', asc = true;

function render() {
  const f = keyOf[sortK];
  const list = [...rows].sort((a, b) => { const x = f(a), y = f(b); const c = typeof x === 'string' ? x.localeCompare(y) : x - y; return asc ? c : -c; });
  tbody.innerHTML = list.map((x) => `<tr${x.rank === 1 ? ' class="top"' : ''}><td>${x.rank}</td><td>${x.name}</td><td>${x.m}</td><td>${x.inn}</td><td>${x.ov}</td><td>${x.r}</td><td class="hl">${x.w}</td><td>${x.best}</td><td>${x.econ.toFixed(2)}</td></tr>`).join('');
  btns.forEach((b) => { if (b.dataset.k === sortK) b.setAttribute('aria-sort', asc ? 'ascending' : 'descending'); else b.removeAttribute('aria-sort'); });
  if (!reduce) tbody.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
}
btns.forEach((b) => b.addEventListener('click', () => {
  const k = b.dataset.k;
  if (k === sortK) asc = !asc;
  else { sortK = k; asc = k === 'rank' || k === 'name' || k === 'econ'; } // natural first direction per column
  render();
}));
render();
