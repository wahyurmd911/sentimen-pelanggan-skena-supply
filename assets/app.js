/* ── util ── */
const $ = (s, r = document) => r.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const S = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fInt = n => Math.round(n).toLocaleString('id-ID');
const fDec = (n, d = 2) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const fPct = (x, d = 1) => fDec(x * 100, d) + '%';
const fRp = n => n >= 1e9 ? 'Rp' + fDec(n / 1e9, 2) + ' M' : n >= 1e6 ? 'Rp' + fDec(n / 1e6, 1) + ' jt' : n >= 1e3 ? 'Rp' + fInt(n / 1e3) + ' rb' : 'Rp' + fInt(n);
const fDate = s => { const [y, m, d] = s.split('-'); return `${+d} ${MN[+m - 1]} ${y}`; };
const div = (a, b) => b ? a / b : null;
const mShort = i => { const [y, m] = RAW.months[i].split('-'); return MN[+m - 1] + (m === '01' ? ' ’' + y.slice(2) : ''); };
const mLong = i => { const [y, m] = RAW.months[i].split('-'); return MN[+m - 1] + ' ' + y; };
const mRange = (a, b) => { const ya = RAW.months[a].slice(0, 4), yb = RAW.months[b].slice(0, 4); const sa = MN[+RAW.months[a].slice(5) - 1], sb = MN[+RAW.months[b].slice(5) - 1]; return ya === yb ? `${sa}–${sb} ${yb}` : `${sa} ${ya}–${sb} ${yb}`; };

const ROWS = RAW.rows.map(a => ({ id: a[0], cust: a[1], nama: a[2], tgl: a[3], m: a[4], kota: a[5], kanal: a[6], bayar: a[7], prod: a[8], unit: a[9], disk: a[10], total: a[11], est: a[12], akt: a[13], rating: a[14], sent: a[15], topik: a[16], text: a[17], tglU: a[18], disc: a[19] }));
const NM = RAW.months.length;
const SENT = ['pos', 'neu', 'neg'];
const MIN_N = 20; // ambang ulasan minimum agar rasio layak dibandingkan

/* ── state ── */
const PERIODS = [{ label: `${NM} bulan · ${mRange(0, NM - 1)}`, a: 0, b: NM - 1 }];
if (NM > 6) PERIODS.push({ label: `6 bulan terakhir · ${mRange(NM - 6, NM - 1)}`, a: NM - 6, b: NM - 1 });
for (let a = 0; a + 2 < NM; a += 3) PERIODS.push({ label: mRange(a, a + 2), a, b: a + 2 });
const state = { period: 0, prod: -1, kanal: -1, kota: -1, metric: 'rev', dim: 'kota', sort: { key: 'n', dir: -1 }, rvTab: -1, q: '', page: 0 };
let cur = null; // hasil agregasi untuk filter aktif

function agg(rows) {
  const a = { n: 0, rev: 0, units: 0, disc: 0, rv: 0, rsum: 0, rate: [0, 0, 0, 0, 0], s: [0, 0, 0], late: 0, lateRv: 0, lateSum: 0, onRv: 0, onSum: 0, cust: new Set() };
  for (const r of rows) {
    a.n++; a.rev += r.total; a.units += r.unit; a.disc += r.disc; a.cust.add(r.cust);
    const late = r.akt > r.est; if (late) a.late++;
    if (r.rating != null) {
      a.rv++; a.rsum += r.rating; a.rate[r.rating - 1]++; a.s[r.sent]++;
      if (late) { a.lateRv++; a.lateSum += r.rating; } else { a.onRv++; a.onSum += r.rating; }
    }
  }
  return a;
}
const rating = a => div(a.rsum, a.rv), negShare = a => div(a.s[2], a.rv), posShare = a => div(a.s[0], a.rv), onTime = a => a.n ? 1 - a.late / a.n : null;

function compute() {
  const P = PERIODS[state.period];
  const base = ROWS.filter(r => (state.prod < 0 || r.prod === state.prod) && (state.kanal < 0 || r.kanal === state.kanal) && (state.kota < 0 || r.kota === state.kota));
  const byMonth = Array.from({ length: NM }, () => []);
  for (const r of base) byMonth[r.m].push(r);
  const rows = base.filter(r => r.m >= P.a && r.m <= P.b);
  const span = (a, b) => agg(byMonth.slice(a, b + 1).flat());
  cur = {
    P, rows, all: agg(rows), months: byMonth.map(agg),
    last3: span(P.b - 2, P.b), prev3: P.b - 5 >= 0 ? span(P.b - 5, P.b - 3) : null,
    first3: P.b - P.a >= 5 ? span(P.a, P.a + 2) : null,
  };
}

/* ── tooltip ── */
const tip = $('#tip');
function showTip(html, e) {
  tip.innerHTML = html; tip.hidden = false;
  const r = tip.getBoundingClientRect();
  let x = e.clientX + 14, y = e.clientY - r.height - 12;
  if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
  if (y < 8) y = e.clientY + 18;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
const hideTip = () => { tip.hidden = true; };
function bindTip(el, html, onIn, onOut) {
  el.addEventListener('mousemove', e => { showTip(typeof html === 'function' ? html() : html, e); onIn && onIn(); });
  el.addEventListener('mouseleave', () => { hideTip(); onOut && onOut(); });
}
const tipRow = (k, v) => `<div class="r"><span>${k}</span><b>${v}</b></div>`;

/* ── chart primitives ── */
function nice(max, n = 4) {
  if (!(max > 0)) return { step: 1, max: 1 };
  const raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  return { step, max: Math.ceil(max / step - 1e-9) * step };
}
function frame(box, o) {
  box.innerHTML = '';
  const W = Math.max(260, box.clientWidth), H = o.h, m = o.m;
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': o.aria || '' }, box);
  return { svg, W, H, m, iw: W - m.l - m.r, ih: H - m.t - m.b };
}
function yAxis(f, lo, hi, step, fmt) {
  const y = v => f.m.t + f.ih - (v - lo) / (hi - lo) * f.ih;
  for (let v = lo; v <= hi + 1e-9; v += step) {
    S('line', { x1: f.m.l, x2: f.W - f.m.r, y1: y(v), y2: y(v), class: v === lo ? 'base' : 'gridl' }, f.svg);
    S('text', { x: f.m.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'tick' }, f.svg).textContent = fmt(v);
  }
  return y;
}
/* items: [{label, value, cls, tip, text}] */
function barChart(box, items, o) {
  const f = frame(box, { h: o.h || 240, m: Object.assign({ l: 44, r: 8, t: 24, b: 28 }, o.m), aria: o.aria });
  const nc = nice(Math.max(...items.map(d => d.value)), o.ticks || 4);
  const y = yAxis(f, 0, nc.max, nc.step, o.yfmt || fInt);
  const band = f.iw / items.length, bw = Math.min(o.bw || 24, band * 0.62), skip = band < 34 ? 2 : 1;
  const hi = o.highlightMax ? items.reduce((b, d, i) => d.value > items[b].value ? i : b, 0) : -1;
  items.forEach((d, i) => {
    const cx = f.m.l + band * i + band / 2, x = cx - bw / 2, y0 = y(0), yt = y(d.value), r = Math.min(4, bw / 2, y0 - yt);
    const bar = S('path', { d: `M${x},${y0}V${yt + r}Q${x},${yt} ${x + r},${yt}H${x + bw - r}Q${x + bw},${yt} ${x + bw},${yt + r}V${y0}Z`, class: 'bar ' + (d.cls || '') + (i === hi ? ' hi' : '') }, f.svg);
    if (i % skip === 0) S('text', { x: cx, y: f.m.t + f.ih + 18, 'text-anchor': 'middle', class: 'tick' }, f.svg).textContent = d.label;
    if (i === hi || d.text) S('text', { x: cx, y: yt - 7, 'text-anchor': 'middle', class: 'vlabel' }, f.svg).textContent = d.text || (o.yfmtFull || o.yfmt || fInt)(d.value);
    const hit = S('rect', { x: f.m.l + band * i, y: f.m.t, width: band, height: f.ih, fill: 'transparent' }, f.svg);
    bindTip(hit, d.tip, () => bar.classList.add('on'), () => bar.classList.remove('on'));
  });
  if (o.xTitle) S('text', { x: f.m.l + f.iw / 2, y: f.H - 4, 'text-anchor': 'middle', class: 'tick' }, f.svg).textContent = o.xTitle;
}
/* pts: [{label, value|null, tip}] */
function lineChart(box, pts, o) {
  const f = frame(box, { h: o.h || 240, m: { l: 44, r: 16, t: 24, b: 28 }, aria: o.aria });
  const vals = pts.map(p => p.value).filter(v => v != null);
  if (!vals.length) { box.innerHTML = '<div class="empty">Belum ada ulasan pada pilihan ini.</div>'; return; }
  const y = yAxis(f, o.lo, o.hi, o.step, o.yfmt);
  const band = f.iw / pts.length, X = i => f.m.l + band * i + band / 2, skip = band < 34 ? 2 : 1;
  const live = pts.map((p, i) => ({ ...p, i })).filter(p => p.value != null);
  const path = live.map((p, k) => (k ? 'L' : 'M') + X(p.i) + ',' + y(p.value)).join('');
  if (live.length > 1) S('path', { d: `${path}L${X(live[live.length - 1].i)},${y(o.lo)}L${X(live[0].i)},${y(o.lo)}Z`, class: 'area' }, f.svg);
  S('path', { d: path, class: 'ln' }, f.svg);
  const cross = S('line', { y1: f.m.t, y2: f.m.t + f.ih, class: 'cross', visibility: 'hidden' }, f.svg);
  const hover = S('circle', { r: 5, class: 'dot', visibility: 'hidden' }, f.svg);
  // label langsung hanya di titik akhir dan titik ekstrem
  const last = live[live.length - 1], ext = live.reduce((b, p) => p.value > b.value ? p : b, live[0]);
  for (const p of new Set([last, ext])) {
    S('circle', { cx: X(p.i), cy: y(p.value), r: 4, class: 'dot' }, f.svg);
    S('text', { x: Math.min(X(p.i), f.W - 22), y: y(p.value) - 10, 'text-anchor': 'middle', class: 'vlabel' }, f.svg).textContent = o.yfmtFull(p.value);
  }
  pts.forEach((p, i) => {
    if (i % skip === 0) S('text', { x: X(i), y: f.m.t + f.ih + 18, 'text-anchor': 'middle', class: 'tick' }, f.svg).textContent = p.label;
    const hit = S('rect', { x: f.m.l + band * i, y: f.m.t, width: band, height: f.ih, fill: 'transparent' }, f.svg);
    bindTip(hit, p.tip, () => {
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('visibility', 'visible');
      if (p.value != null) { hover.setAttribute('cx', X(i)); hover.setAttribute('cy', y(p.value)); hover.setAttribute('visibility', 'visible'); }
    }, () => { cross.setAttribute('visibility', 'hidden'); hover.setAttribute('visibility', 'hidden'); });
  });
}
function sparkline(vals) {
  const v = vals.filter(x => x != null);
  if (v.length < 2) return '';
  const W = 120, H = 44, lo = Math.min(...v), hi = Math.max(...v), rng = hi - lo || 1;
  const pts = vals.map((x, i) => x == null ? null : [4 + i * (W - 10) / (vals.length - 1), 6 + (1 - (x - lo) / rng) * (H - 12)]).filter(Boolean);
  const [ex, ey] = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('')}" fill="none" stroke="var(--axis)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/></svg>`;
}
/* delta 3 bulan terakhir vs 3 bulan sebelumnya; kind: rel (%), pp (poin persentase), pts (poin) */
function delta(c, p, kind) {
  if (c == null || p == null || !cur.prev3) return '';
  const d = kind === 'rel' ? (p ? (c - p) / p : 0) : c - p;
  const txt = kind === 'rel' ? fDec(Math.abs(d) * 100, 1) + '%' : kind === 'pp' ? fDec(Math.abs(d) * 100, 1) + ' pp' : fDec(Math.abs(d), 2);
  const flat = Math.abs(d) < (kind === 'pts' ? 0.005 : 0.0005);
  return `<span class="delta ${flat ? 'flat' : d > 0 ? 'up' : 'down'}">${flat ? '■' : d > 0 ? '▲' : '▼'} ${txt}</span>`;
}
const DELTA_NOTE = '3 bln terakhir vs 3 bln sebelumnya';

/* ── render: ringkasan ── */
const ICON = {
  rev: '<svg viewBox="0 0 18 18"><rect x="2.5" y="4.5" width="13" height="10" rx="2"/><path d="M2.5 8h13M11.5 11.300h1.500"/></svg>',
  ord: '<svg viewBox="0 0 18 18"><path d="M4 6.500h10l-.8 8.500H4.800L4 6.500z"/><path d="M6.500 6.500V5a2.500 2.500 0 015 0v1.500"/></svg>',
  pos: '<svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="6.500"/><path d="M6.300 10.500a3.200 3.200 0 005.400 0M6.800 7.300h.01M11.200 7.300h.01"/></svg>',
  ship: '<svg viewBox="0 0 18 18"><path d="M2.500 5h8.500v7.500h-8.500zM11 7.500h2.800l1.700 2.200v2.800H11"/><circle cx="5.500" cy="13.300" r="1.300"/><circle cx="12.800" cy="13.300" r="1.300"/></svg>',
};
function renderSummary() {
  const a = cur.all, P = cur.P, l = cur.last3, p = cur.prev3 || {};
  $('#h-rating').textContent = a.rv ? fDec(rating(a)) : '–';
  $('#h-meta').innerHTML = `<span>${fInt(a.rv)} ulasan · ${a.rv === a.n ? 'semua pesanan diulas' : fPct(div(a.rv, a.n) || 0, 0) + ' pesanan diulas'}</span>` + (cur.prev3 && l.rv && p.rv ? `<span class="chip">${rating(l) >= rating(p) ? '▲' : '▼'} ${fDec(Math.abs(rating(l) - rating(p)))} · 3 bln terakhir</span>` : '');
  $('#h-stats').innerHTML = `<div><span>Bintang 4–5</span><b>${a.rv ? fPct((a.rate[3] + a.rate[4]) / a.rv, 0) : '–'}</b></div><div><span>Bintang 1–2</span><b>${a.rv ? fPct((a.rate[0] + a.rate[1]) / a.rv, 0) : '–'}</b></div>`;
  const mx = Math.max(1, ...a.rate);
  $('#h-dist').innerHTML = [5, 4, 3, 2, 1].map(s => `<div class="dist-row"><span>${s} ★</span><span class="track"><span class="fill" style="width:${a.rate[s - 1] / mx * 100}%"></span></span><span class="v">${fInt(a.rate[s - 1])} · ${a.rv ? fPct(a.rate[s - 1] / a.rv, 0) : '0%'}</span></div>`).join('');

  const ms = cur.months.slice(P.a, P.b + 1);
  const tiles = [
    { ico: 'rev', label: 'Penjualan bersih', val: fRp(a.rev), sub: `${fInt(a.units)} unit · diskon ${fRp(a.disc)}`, d: delta(l.rev, p.rev, 'rel'), sp: ms.map(m => m.rev) },
    { ico: 'ord', label: 'Pesanan', val: fInt(a.n), sub: `${fInt(a.cust.size)} pelanggan · ${a.n ? fRp(a.rev / a.n) : '–'} per pesanan`, d: delta(l.n, p.n, 'rel'), sp: ms.map(m => m.n) },
    { ico: 'pos', label: 'Sentimen positif', val: a.rv ? fPct(posShare(a)) : '–', sub: `${fInt(a.s[0])} dari ${fInt(a.rv)} ulasan`, d: delta(posShare(l), p.rv ? posShare(p) : null, 'pp'), sp: ms.map(posShare) },
    { ico: 'ship', label: 'Pengiriman tepat waktu', val: a.n ? fPct(onTime(a)) : '–', sub: `${fInt(a.late)} pesanan melewati estimasi`, d: delta(onTime(l), p.n ? onTime(p) : null, 'pp'), sp: ms.map(onTime) },
  ];
  $('#kpis').innerHTML = tiles.map(t => `<div class="card kpi"><div class="kpi-top"><div class="kpi-ico">${ICON[t.ico]}</div><span>${t.label}</span></div><div><div class="kpi-val">${t.val}</div><div class="kpi-sub">${t.sub}</div>${t.d ? `<div class="kpi-row">${t.d}<span>${DELTA_NOTE}</span></div>` : ''}</div>${sparkline(t.sp)}</div>`).join('');
}

/* ── render: tren ── */
const METRICS = {
  rev: { label: 'Penjualan', get: m => m.rev, fmt: fRp, axis: v => v >= 1e6 ? fDec(v / 1e6, v % 1e6 ? 1 : 0) + ' jt' : v ? fInt(v / 1e3) + ' rb' : '0', big: c => fRp(c.all.rev / (c.P.b - c.P.a + 1)), note: 'rata-rata penjualan bersih per bulan' },
  ord: { label: 'Pesanan', get: m => m.n, fmt: fInt, axis: fInt, big: c => fDec(c.all.n / (c.P.b - c.P.a + 1), 1), note: 'rata-rata pesanan per bulan' },
  rat: { label: 'Rating', line: true, get: rating, fmt: v => fDec(v), axis: v => fDec(v, 1), big: c => c.all.rv ? fDec(rating(c.all)) : '–', note: 'rating rata-rata periode ini (skala 1–5)' },
  neg: { label: 'Ulasan negatif', line: true, get: negShare, fmt: v => fPct(v), axis: v => fPct(v, 0), big: c => c.all.rv ? fPct(negShare(c.all)) : '–', note: 'porsi ulasan bersentimen negatif' },
};
function renderTrend() {
  const M = METRICS[state.metric], P = cur.P, idx = []; for (let i = P.a; i <= P.b; i++) idx.push(i);
  $('#trend-sub').textContent = `Per bulan pesanan · ${mRange(P.a, P.b)}`;
  $('#trend-big').textContent = M.big(cur); $('#trend-note').textContent = M.note;
  const tipOf = i => { const m = cur.months[i]; return `<div class="t">${mLong(i)}</div>` + tipRow('Penjualan', fRp(m.rev)) + tipRow('Pesanan', fInt(m.n)) + tipRow('Rating', m.rv ? fDec(rating(m)) : '–') + tipRow('Ulasan negatif', m.rv ? fPct(negShare(m)) : '–') + tipRow('Jumlah ulasan', fInt(m.rv)); };
  const box = $('#trendChart');
  if (!cur.all.n) { box.innerHTML = '<div class="empty">Tidak ada pesanan pada kombinasi filter ini.</div>'; return; }
  if (!M.line) {
    barChart(box, idx.map(i => ({ label: mShort(i), value: M.get(cur.months[i]), tip: tipOf(i) })), { h: 244, ticks: 5, yfmt: M.axis, yfmtFull: M.fmt, highlightMax: true, bw: 24, m: { l: 48 }, aria: `${M.label} per bulan` });
  } else {
    const vals = idx.map(i => M.get(cur.months[i])), v = vals.filter(x => x != null);
    let lo = 0, hi, step;
    if (state.metric === 'rat') { lo = Math.max(1, Math.floor(Math.min(...v) * 2 - 0.5) / 2); hi = Math.min(5, Math.ceil(Math.max(...v) * 2 + 0.5) / 2); step = 0.5; if (hi <= lo) hi = lo + 0.5; }
    else { const nc = nice(Math.max(0.05, ...v), 4); hi = nc.max; step = nc.step; }
    lineChart(box, idx.map((i, k) => ({ label: mShort(i), value: vals[k], tip: tipOf(i) })), { h: 244, lo, hi, step, yfmt: M.axis, yfmtFull: M.fmt, aria: `${M.label} per bulan` });
  }
}

/* ── render: sentimen & frekuensi belanja ── */
function renderSentiment() {
  const a = cur.all, svg = $('#donut'); svg.innerHTML = '';
  $('#sent-sub').textContent = `Dari ${fInt(a.rv)} ulasan yang masuk`;
  const r = 60, C = 2 * Math.PI * r, gap = 2; let off = 0;
  S('circle', { cx: 75, cy: 75, r, stroke: 'var(--surface-2)' }, svg);
  a.s.forEach((n, i) => {
    if (!n) return;
    const len = n / a.rv * C;
    const c = S('circle', { cx: 75, cy: 75, r, class: 's-' + SENT[i], 'stroke-dasharray': `${Math.max(0.5, len - gap)} ${C}`, 'stroke-dashoffset': -off, transform: 'rotate(-90 75 75)' }, svg);
    bindTip(c, `<div class="t">${RAW.sent[i]}</div><div class="v">${fPct(n / a.rv)}</div>` + tipRow('Ulasan', fInt(n)));
    off += len;
  });
  S('text', { x: 75, y: 76, 'text-anchor': 'middle', class: 'c1' }, svg).textContent = fInt(a.rv);
  S('text', { x: 75, y: 93, 'text-anchor': 'middle', class: 'c2' }, svg).textContent = 'ulasan';
  $('#sent-legend').innerHTML = a.s.map((n, i) => `<div class="rowline"><span><i class="sw ${SENT[i]}"></i>${RAW.sent[i]}</span><span class="n">${fInt(n)}</span><b>${a.rv ? fPct(n / a.rv) : '–'}</b></div>`).join('');
  const cnt = new Map(); for (const r of cur.rows) cnt.set(r.cust, (cnt.get(r.cust) || 0) + 1);
  const fq = [0, 0, 0]; for (const v of cnt.values()) fq[Math.min(v, 3) - 1]++;
  const FQ = ['1 pesanan', '2 pesanan', '3+ pesanan'];
  $('#freq-n').textContent = `${fInt(cnt.size)} pelanggan`;
  $('#freq-bar').innerHTML = fq.map((n, i) => n ? `<span class="o${i + 1}" style="flex:${n}"></span>` : '').join('');
  $('#freq-legend').innerHTML = fq.map((n, i) => `<span><i class="sw o${i + 1}"></i>${FQ[i]}<b>${cnt.size ? fPct(n / cnt.size) : '–'}</b></span>`).join('');
}

/* ── render: produk ── */
function produkStats() {
  return RAW.produk.map((p, i) => {
    const rows = cur.rows.filter(r => r.prod === i), a = agg(rows), t = new Map();
    for (const r of rows) if (r.sent === 2) t.set(r.topik, (t.get(r.topik) || 0) + 1);
    const top = [...t].sort((x, y) => y[1] - x[1])[0];
    return { ...p, a, n: a.n, rev: a.rev, rating: rating(a), neg: negShare(a), top: top && a.s[2] >= 5 ? { name: RAW.topik[top[0]], n: top[1], of: a.s[2] } : null };
  }).filter(d => d.n);
}
function renderProducts() {
  const list = produkStats().sort((x, y) => y.rev - x.rev), box = $('#prod');
  if (!list.length) { box.innerHTML = '<div class="empty">Tidak ada pesanan pada pilihan ini.</div>'; return; }
  const mx = Math.max(...list.map(d => d.rev));
  box.innerHTML = '<div class="prod-row asp-h"><span>Produk</span><span>Penjualan bersih</span><span>Rating</span><span>Keluhan utama</span></div>' +
    list.map((d, k) => `<div class="prod-row" data-k="${k}"><div class="prod-name"><b>${esc(d.nama)}</b><span>Rp${fInt(d.harga)} · ${fInt(d.n)} pesanan</span></div><div class="prod-bar"><i style="width:${d.rev / mx * 100}%"></i><span>${fRp(d.rev)}</span></div><span class="num${d.a.rv < MIN_N ? ' low-n' : ''}">${d.a.rv ? fDec(d.rating) : '–'}</span><div class="prod-top">${d.top ? `<b>${esc(d.top.name)}</b><span>${fInt(d.top.n)} dari ${fInt(d.top.of)} ulasan negatif</span>` : '<span>Ulasan negatif terlalu sedikit</span>'}</div></div>`).join('');
  box.querySelectorAll('.prod-row[data-k]').forEach(row => {
    const d = list[+row.dataset.k];
    bindTip(row, `<div class="t">${esc(d.nama)} · ${d.sku}</div><div class="v">${fRp(d.rev)}</div>` + tipRow('Pesanan', fInt(d.n)) + tipRow('Unit', fInt(d.a.units)) + tipRow('Rating', d.a.rv ? fDec(d.rating) : '–') + tipRow('Positif', d.a.rv ? fPct(posShare(d.a)) : '–') + tipRow('Negatif', d.a.rv ? fPct(d.neg) : '–') + tipRow('Terlambat', fPct(d.a.late / d.n)));
  });
}

/* ── render: topik ── */
function topikStats() {
  return RAW.topik.map((name, i) => { const a = agg(cur.rows.filter(r => r.topik === i)); return { name, a, n: a.rv, neg: negShare(a), pos: posShare(a), rating: rating(a) }; }).filter(d => d.n);
}
function renderTopics() {
  const list = topikStats().sort((x, y) => y.neg - x.neg), box = $('#asp');
  if (!list.length) { box.innerHTML = '<div class="empty">Belum ada ulasan pada pilihan ini.</div>'; return; }
  box.innerHTML = '<div class="asp-row asp-h"><span>Topik</span><span>Komposisi sentimen</span><span>Negatif</span><span>Rating</span><span>Ulasan</span></div>' +
    list.map((d, k) => `<div class="asp-row" data-k="${k}"><span class="asp-name">${esc(d.name)}</span><div class="asp-bar">${d.a.s.map((n, i) => n ? `<span class="${SENT[i]}" style="flex:${n}" data-i="${i}"><em>${fPct(n / d.n, 0)}</em></span>` : '').join('')}</div><span class="num"><b>${fPct(d.neg)}</b></span><span class="num">${fDec(d.rating)}</span><span class="num${d.n < MIN_N ? ' low-n' : ''}">${fInt(d.n)}</span></div>`).join('');
  box.querySelectorAll('.asp-bar span').forEach(seg => {
    const d = list[+seg.closest('.asp-row').dataset.k], i = +seg.dataset.i, em = seg.firstChild;
    if (em.scrollWidth + 10 > seg.clientWidth) em.remove(); // label hanya tampil jika muat
    bindTip(seg, `<div class="t">${esc(d.name)} · ${RAW.sent[i]}</div><div class="v">${fPct(d.a.s[i] / d.n)}</div>` + tipRow('Ulasan', `${fInt(d.a.s[i])} dari ${fInt(d.n)}`));
  });
}

/* ── render: temuan ── */
function renderInsights() {
  const a = cur.all, out = [], tp = topikStats().filter(d => d.n >= MIN_N);
  if (tp.length > 1) {
    const worst = tp.reduce((b, d) => d.neg > b.neg ? d : b), best = tp.reduce((b, d) => d.rating > b.rating ? d : b);
    out.push([`${worst.name} paling banyak dikeluhkan`, `${fPct(worst.neg, 0)} dari ${fInt(worst.n)} ulasan bertopik ini negatif (rating ${fDec(worst.rating)}), tertinggi di antara semua topik.`]);
    if (best !== worst) out.push([`${best.name} paling memuaskan`, `Rating ${fDec(best.rating)} dengan ${fPct(best.neg, 0)} ulasan negatif dari ${fInt(best.n)} ulasan.`]);
  }
  if (a.lateRv >= 10 && a.onRv >= 10) {
    const gap = a.onSum / a.onRv - a.lateSum / a.lateRv;
    out.push([`Keterlambatan ${gap > 0 ? 'menurunkan' : 'tidak menurunkan'} rating`, `${fPct(a.late / a.n)} pesanan tiba melewati estimasi. Rating-nya ${fDec(a.lateSum / a.lateRv)}, dibanding ${fDec(a.onSum / a.onRv)} untuk pesanan tepat waktu (selisih ${fDec(Math.abs(gap))} poin).`]);
  }
  if (state.prod < 0) {
    const pr = produkStats().filter(d => d.a.rv >= MIN_N);
    if (pr.length > 1) {
      const lo = pr.reduce((b, d) => d.rating < b.rating ? d : b), hi = pr.reduce((b, d) => d.rating > b.rating ? d : b), gap = hi.rating - lo.rating;
      out.push(gap < 0.3
        ? ['Kepuasan antarproduk hampir merata', `Rating ${fInt(pr.length)} produk hanya berkisar ${fDec(lo.rating)} (${lo.nama}) sampai ${fDec(hi.rating)} (${hi.nama}). Masalahnya lebih terkait topik dan proses daripada satu produk tertentu.`]
        : [`${lo.nama} punya rating terendah`, `Rating ${fDec(lo.rating)} dengan ${fPct(lo.neg, 0)} ulasan negatif, terpaut ${fDec(gap)} poin dari ${hi.nama} (${fDec(hi.rating)}).`]);
    }
  }
  if (state.kanal < 0) {
    const ch = RAW.kanal.map((name, i) => ({ name, a: agg(cur.rows.filter(r => r.kanal === i)) })).filter(d => d.a.rv >= MIN_N);
    if (ch.length > 1) {
      const w = ch.reduce((b, d) => rating(d.a) < rating(b.a) ? d : b), t = ch.reduce((b, d) => rating(d.a) > rating(b.a) ? d : b);
      out.push([`${w.name} punya rating terendah`, `Rating ${fDec(rating(w.a))} dan ${fPct(negShare(w.a), 0)} ulasan negatif dari ${fInt(w.a.rv)} ulasan. Tertinggi ${t.name} dengan rating ${fDec(rating(t.a))}.`]);
    }
  }
  if (cur.first3 && cur.first3.rv >= MIN_N && cur.last3.rv >= MIN_N) {
    const f = negShare(cur.first3), l = negShare(cur.last3), P = cur.P, d = Math.abs(l - f) < 0.01 ? 'stabil' : l < f ? 'turun' : 'naik';
    out.push([`Ulasan negatif ${d} sepanjang periode`, `Dari ${fPct(f, 0)} pada ${mRange(P.a, P.a + 2)} menjadi ${fPct(l, 0)} pada ${mRange(P.b - 2, P.b)}; rating bergerak dari ${fDec(rating(cur.first3))} ke ${fDec(rating(cur.last3))}.`]);
  }
  $('#ins').innerHTML = out.length ? out.slice(0, 5).map((o, i) => `<li><span class="k">${i + 1}</span><div><b>${esc(o[0])}</b><p>${esc(o[1])}</p></div></li>`).join('') : `<li class="empty" style="grid-template-columns:1fr">Sampel ulasan terlalu kecil (di bawah ${MIN_N}) untuk menarik temuan yang layak.</li>`;
}

/* ── render: tabel dimensi ── */
const DIMS = {
  kota: { label: 'Kota', key: r => r.kota, name: i => RAW.kota[i] },
  kanal: { label: 'Kanal', key: r => r.kanal, name: i => RAW.kanal[i] },
  prod: { label: 'Produk', key: r => r.prod, name: i => RAW.produk[i].nama },
  bayar: { label: 'Pembayaran', key: r => r.bayar, name: i => RAW.bayar[i] },
  disk: { label: 'Diskon', key: r => r.disk, name: i => +i ? `Diskon ${i}%` : 'Tanpa diskon' },
};
const COLS = [['n', 'Pesanan'], ['rev', 'Penjualan'], ['aov', 'Per pesanan'], ['late', 'Terlambat'], ['rv', 'Ulasan'], ['rating', 'Rating'], ['pos', 'Positif'], ['neg', 'Negatif']];
function renderDim() {
  const D = DIMS[state.dim], g = new Map();
  for (const r of cur.rows) { const k = D.key(r); (g.get(k) || g.set(k, []).get(k)).push(r); }
  const list = [...g].map(([k, rows]) => { const a = agg(rows); return { name: D.name(k), n: a.n, rev: a.rev, aov: a.rev / a.n, late: a.late / a.n, rv: a.rv, rating: rating(a), neg: negShare(a), pos: posShare(a) }; });
  const { key, dir } = state.sort;
  list.sort((x, y) => key === 'name' ? dir * x.name.localeCompare(y.name) : dir * ((x[key] ?? -1) - (y[key] ?? -1)));
  const mx = Math.max(1, ...list.map(d => d.n));
  const th = (k, t, r) => `<th${r ? ' class="r"' : ''}${key === k ? ` aria-sort="${dir < 0 ? 'descending' : 'ascending'}"` : ''}><button type="button" data-k="${k}">${t}${key === k ? (dir < 0 ? ' ↓' : ' ↑') : ''}</button></th>`;
  $('#dim-table').innerHTML = `<thead><tr>${th('name', D.label)}${COLS.map((c, i) => th(c[0], c[1], i > 0)).join('')}</tr></thead><tbody>` +
    (list.length ? list.map(d => { const low = d.rv < MIN_N ? ' low-n' : ''; return `<tr><td><b style="font-weight:600">${esc(d.name)}</b></td><td><div class="cellbar"><span>${fInt(d.n)}</span><i style="width:${d.n / mx * 100}%"></i></div></td><td class="r">${fRp(d.rev)}</td><td class="r">${fRp(d.aov)}</td><td class="r">${fPct(d.late)}</td><td class="r${low}">${fInt(d.rv)}</td><td class="r${low}">${d.rv ? fDec(d.rating) : '–'}</td><td class="r${low}">${d.rv ? fPct(d.pos) : '–'}</td><td class="r${low}">${d.rv ? fPct(d.neg) : '–'}</td></tr>`; }).join('') : '<tr><td colspan="9" class="empty">Tidak ada data.</td></tr>') + '</tbody>';
  $('#dim-note').textContent = list.some(d => d.rv < MIN_N) ? `Angka berwarna abu berasal dari kurang dari ${MIN_N} ulasan; baca dengan hati-hati.` : 'Rating, Positif, dan Negatif dihitung dari pesanan yang diulas.';
}

/* ── render: pengiriman ── */
function renderShip() {
  const a = cur.all, g = new Map();
  for (const r of cur.rows) { const d = r.akt - r.est; g.set(d, (g.get(d) || 0) + 1); }
  $('#ship-stats').innerHTML =
    `<div class="stat"><span>Terlambat</span><b>${a.n ? fPct(a.late / a.n) : '–'}</b><small>${fInt(a.late)} dari ${fInt(a.n)} pesanan</small></div>` +
    `<div class="stat"><span>Rating tepat waktu</span><b>${a.onRv ? fDec(a.onSum / a.onRv) : '–'}</b><small>${fInt(a.onRv)} ulasan</small></div>` +
    `<div class="stat"><span>Rating terlambat</span><b>${a.lateRv ? fDec(a.lateSum / a.lateRv) : '–'}</b><small>${fInt(a.lateRv)} ulasan</small></div>`;
  const box = $('#shipChart');
  if (!g.size) { box.innerHTML = '<div class="empty">Tidak ada data.</div>'; return; }
  const ks = [...g.keys()], lo = Math.min(...ks), hi = Math.max(...ks), items = [];
  for (let d = lo; d <= hi; d++) { const n = g.get(d) || 0; items.push({ label: d > 0 ? '+' + d : d < 0 ? '−' + -d : '0', value: n, cls: d > 0 ? 'neg' : 'pos', tip: `<div class="t">${d > 0 ? `Terlambat ${d} hari` : d < 0 ? `Lebih cepat ${-d} hari` : 'Tepat sesuai estimasi'}</div><div class="v">${fInt(n)} pesanan</div>` + tipRow('Porsi', fPct(n / a.n)) }); }
  barChart(box, items, { h: 250, bw: 22, m: { b: 46 }, xTitle: 'hari terhadap estimasi (− lebih cepat, + terlambat)', aria: 'Distribusi selisih hari pengiriman' });
}

/* ── render: ulasan ── */
const PAGE = 8;
function renderReviews() {
  const q = state.q.trim().toLowerCase();
  const list = cur.rows.filter(r => r.rating != null && (state.rvTab < 0 || r.sent === state.rvTab) && (!q || (r.text + ' ' + r.nama + ' ' + RAW.produk[r.prod].nama + ' ' + RAW.kota[r.kota] + ' ' + RAW.kanal[r.kanal] + ' ' + RAW.topik[r.topik] + ' ' + r.id).toLowerCase().includes(q))).sort((x, y) => y.tglU.localeCompare(x.tglU) || y.id.localeCompare(x.id));
  const pages = Math.max(1, Math.ceil(list.length / PAGE)); state.page = Math.min(state.page, pages - 1);
  const view = list.slice(state.page * PAGE, state.page * PAGE + PAGE);
  $('#rv-sub').textContent = 'Terbaru lebih dulu · berdasarkan tanggal ulasan';
  $('#rv-table').innerHTML = '<thead><tr><th>Tanggal</th><th>Pembeli</th><th>Produk</th><th>Rating</th><th>Topik</th><th>Sentimen</th><th>Ulasan</th></tr></thead><tbody>' +
    (view.length ? view.map(r => `<tr><td style="white-space:nowrap">${fDate(r.tglU)}</td><td><div class="rv-id">${esc(r.nama)}</div><div class="rv-sub">${esc(RAW.kota[r.kota])} · ${esc(RAW.kanal[r.kanal])}</div></td><td><div class="rv-id" style="font-weight:500">${esc(RAW.produk[r.prod].nama)}</div><div class="rv-sub">${r.id}</div></td><td><span class="stars" title="${r.rating} dari 5"><b>${'★'.repeat(r.rating)}</b>${'★'.repeat(5 - r.rating)}</span></td><td style="white-space:nowrap">${esc(RAW.topik[r.topik])}</td><td><span class="pill ${SENT[r.sent]}">${RAW.sent[r.sent]}</span></td><td><div class="rv-text" title="${esc(r.text)}">${esc(r.text)}</div></td></tr>`).join('') : '<tr><td colspan="7" class="empty">Tidak ada ulasan yang cocok.</td></tr>') + '</tbody>';
  $('#rv-info').textContent = list.length ? `${fInt(state.page * PAGE + 1)}–${fInt(state.page * PAGE + view.length)} dari ${fInt(list.length)} ulasan` : '0 ulasan';
  $('#rv-prev').disabled = state.page === 0; $('#rv-next').disabled = state.page >= pages - 1;
}

/* ── kontrol ── */
function segmented(id, opts, get, set) {
  const box = $(id);
  box.innerHTML = opts.map(([v, t]) => `<button type="button" data-v="${v}">${t}</button>`).join('');
  const sync = () => box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v) === String(get())));
  box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; set(b.dataset.v); sync(); });
  sync();
}
function fillSelect(id, opts, key) {
  const s = $(id);
  s.innerHTML = opts.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('');
  s.addEventListener('change', () => { state[key] = +s.value; state.page = 0; renderAll(); });
}
function renderAll() {
  compute();
  const a = cur.all;
  $('#scope').innerHTML = `Menampilkan <b>${fInt(a.n)}</b> pesanan · <b>${fInt(a.rv)}</b> ulasan`;
  $('#f-reset').hidden = !(state.period || state.prod >= 0 || state.kanal >= 0 || state.kota >= 0);
  renderSummary(); renderTrend(); renderSentiment(); renderProducts(); renderInsights(); renderTopics(); renderShip(); renderDim(); renderReviews();
}

(function init() {
  const total = agg(ROWS);
  $('#title').textContent = 'Sentimen Pelanggan Skena Supply';
  $('#ds-n').textContent = fInt(ROWS.length); $('#ds-c').textContent = fInt(total.cust.size);
  $('#ds-p').textContent = mRange(0, NM - 1); $('#ds-s').textContent = fInt(RAW.produk.length);

  fillSelect('#f-period', PERIODS.map((p, i) => [i, p.label]), 'period');
  fillSelect('#f-prod', [[-1, 'Semua produk'], ...RAW.produk.map((p, i) => [i, p.nama])], 'prod');
  fillSelect('#f-kanal', [[-1, 'Semua kanal'], ...RAW.kanal.map((k, i) => [i, k])], 'kanal');
  fillSelect('#f-kota', [[-1, 'Semua kota'], ...RAW.kota.map((k, i) => [i, k])], 'kota');
  $('#f-reset').addEventListener('click', () => { Object.assign(state, { period: 0, prod: -1, kanal: -1, kota: -1, page: 0 }); $('#f-period').value = 0; $('#f-prod').value = $('#f-kanal').value = $('#f-kota').value = -1; renderAll(); });

  segmented('#metric-seg', Object.entries(METRICS).map(([k, m]) => [k, m.label]), () => state.metric, v => { state.metric = v; renderTrend(); });
  segmented('#dim-seg', Object.entries(DIMS).map(([k, d]) => [k, d.label]), () => state.dim, v => { state.dim = v; state.sort = { key: 'n', dir: -1 }; renderDim(); });
  segmented('#rv-seg', [[-1, 'Semua'], [2, 'Negatif'], [1, 'Netral'], [0, 'Positif']], () => state.rvTab, v => { state.rvTab = +v; state.page = 0; renderReviews(); });
  $('#dim-table').addEventListener('click', e => { const b = e.target.closest('th button'); if (!b) return; const k = b.dataset.k; state.sort = { key: k, dir: state.sort.key === k ? -state.sort.dir : (k === 'name' ? 1 : -1) }; renderDim(); });
  $('#rv-q').addEventListener('input', e => { state.q = e.target.value; state.page = 0; renderReviews(); });
  $('#rv-prev').addEventListener('click', () => { state.page--; renderReviews(); });
  $('#rv-next').addEventListener('click', () => { state.page++; renderReviews(); });
  $('#btn-print').addEventListener('click', () => print());
  $('#btn-theme').addEventListener('click', () => { const d = document.documentElement, dark = d.dataset.theme !== 'dark'; d.dataset.theme = dark ? 'dark' : 'light'; $('#btn-theme span').textContent = dark ? 'Terang' : 'Gelap'; });
  if (location.hash === '#dark') $('#btn-theme').click();

  const links = [...document.querySelectorAll('.nav a')];
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-20% 0px -65% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => io.observe(s));

  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { renderTrend(); renderTopics(); renderShip(); }, 120); });
  renderAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderTopics);
})();
