/**
 * scrape.js — inti pengambilan data produk Tokopedia.
 *
 * Strategi: buka halaman pencarian Tokopedia dengan Chromium sungguhan
 * (Playwright), lalu SADAP respons GraphQL internal yang dipakai halaman itu
 * sendiri (gql.tokopedia.com/graphql/SearchProductV5Query). Payload JSON-nya
 * stabil, berbeda dengan markup HTML yang kelasnya ber-hash dan sering berubah.
 *
 * Bentuk payload (diverifikasi dari dump nyata 2026-10):
 *   [0].data.searchProductV5.data.products[] -> {
 *     id, oldID, name, url, shop{id,name,city,url}, price{number,text,original,discountPercentage},
 *     rating, category{name,breadcrumb}, labelGroups[{title}], ads{tag}, stock
 *   }
 * Catatan: "terjual" TIDAK punya field sendiri — muncul sebagai teks
 *          labelGroups[].title ("100+ terjual"). Karena itu diparsing manual.
 *
 * Modul ini sengaja tidak menyentuh Apify SDK, supaya bisa dipakai CLI maupun
 * Actor dan mudah diuji terpisah.
 */

'use strict';

const { chromium } = require('playwright');

const GQL_URL_HINT = /gql\.tokopedia\.com|graphql/i;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** "Rp1.029.000" / 1029000 -> 1029000 */
function angkaId(s) {
  if (s == null) return null;
  if (typeof s === 'number') return s;
  let t = String(s).toLowerCase().replace(/rp|\s|\./g, '');
  let mult = 1;
  if (/rb|k$/.test(t)) { mult = 1000; t = t.replace(/rb|k/g, ''); }
  else if (/jt|m$/.test(t)) { mult = 1000000; t = t.replace(/jt|m/g, ''); }
  const m = t.match(/-?\d+(?:,\d+)?/);
  if (!m) return null;
  return Math.round(parseFloat(m[0].replace(',', '.')) * mult);
}

/** "100+ terjual", "3rb+ terjual" -> angka */
function angkaTerjual(teks) {
  if (!teks) return null;
  const m = String(teks).match(/([\d.,]+)\s*(rb|jt|k)?\s*\+?\s*terjual/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  const mult = m[2] ? (/rb|k/i.test(m[2]) ? 1000 : 1000000) : 1;
  return isNaN(n) ? null : Math.round(n * mult);
}

/** Ambil array produk dari payload SearchProductV5, dengan cadangan rekursif. */
function ambilProduk(body) {
  const keluar = [];
  const nodes = Array.isArray(body) ? body : [body];
  for (const n of nodes) {
    const arr = n && n.data && n.data.searchProductV5 && n.data.searchProductV5.data
      && n.data.searchProductV5.data.products;
    if (Array.isArray(arr)) keluar.push(...arr);
  }
  if (keluar.length) return keluar;

  (function cari(o, d) {
    if (!o || d > 8 || keluar.length > 500) return;
    if (Array.isArray(o)) {
      if (o.length && o[0] && typeof o[0] === 'object' && (o[0].price != null || o[0].name != null)) {
        keluar.push(...o.filter(x => x && typeof x === 'object' && (x.price != null || x.name)));
        return;
      }
      o.forEach(v => cari(v, d + 1));
    } else if (typeof o === 'object') {
      Object.values(o).forEach(v => cari(v, d + 1));
    }
  })(body, 0);
  return keluar;
}

/** Satu produk payload -> baris ternormalisasi. */
function mapProduk(p) {
  if (!p || typeof p !== 'object') return null;
  const toko = p.shop || {};
  const harga = p.price || {};
  const diskon = (typeof harga.discountPercentage === 'number' && harga.discountPercentage > 0)
    ? harga.discountPercentage : null;
  const asli = (harga.original && harga.original !== '') ? angkaId(harga.original) : null;
  const hargaNum = typeof harga.number === 'number' ? harga.number : angkaId(harga.text);

  let terjual = null;
  for (const g of (p.labelGroups || [])) {
    const t = angkaTerjual(g && g.title);
    if (t != null) { terjual = t; break; }
  }

  const id = p.id != null ? String(p.id) : (p.oldID != null ? String(p.oldID) : null);
  if (!id && !p.name) return null;

  return {
    id,
    nama: p.name ? String(p.name).slice(0, 300) : null,
    harga: hargaNum,
    harga_teks: harga.text || null,
    harga_asli: asli,
    diskon_pct: diskon || ((asli && hargaNum && asli > hargaNum)
      ? Math.round((1 - hargaNum / asli) * 100) : null),
    rating: (p.rating && p.rating !== '') ? parseFloat(p.rating) : null,
    terjual,
    toko_id: toko.id != null ? String(toko.id) : (toko.oldID != null ? String(toko.oldID) : null),
    toko_nama: toko.name || null,
    toko_kota: toko.city || null,
    toko_tier: (typeof toko.tier === 'number') ? toko.tier : null,
    toko_url: toko.url || null,
    kategori: p.category ? (p.category.name || null) : null,
    kategori_jalur: p.category ? (p.category.breadcrumb || null) : null,
    gambar: (p.mediaURL && (p.mediaURL.image300 || p.mediaURL.image)) || null,
    iklan: !!(p.ads && p.ads.tag),
    url: p.url || (id ? `https://www.tokopedia.com/p/${id}` : null),
    diambil_pada: new Date().toISOString(),
  };
}

/** Buka URL dengan beberapa kali percobaan (Tokopedia kadang menolak HTTP/2). */
async function bukaHalaman(page, url, timeoutMs) {
  let terakhir = null;
  for (let coba = 1; coba <= 3; coba++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      return;
    } catch (e) {
      terakhir = e;
      if (!/HTTP2|ERR_|TIMED_OUT|net::/i.test(String(e.message))) throw e;
      await page.waitForTimeout(1500 * coba);
    }
  }
  throw terakhir;
}

/**
 * Definisi query + parameter pencarian Tokopedia (dipakai semua jalur cadangan).
 */
const GQL_QUERY = `query SearchProductV5Query($params: String!) {
  searchProductV5(params: $params) {
    data {
      products {
        id oldID name url
        shop { id name city url tier }
        price { number text original discountPercentage }
        rating
        category { name breadcrumb }
        mediaURL { image300 image }
        labelGroups { title }
        ads { tag }
      }
    }
  }
}`;

function gqlParams(query) {
  return `q=${query}&ob=23&page=1&perpage=60&rows=60&unique_id=1&source=search`;
}

function badanGQL(query) {
  return JSON.stringify([{
    operationName: 'SearchProductV5Query',
    variables: { params: gqlParams(query) },
    query: GQL_QUERY,
  }]);
}

/**
 * Jalur cadangan A: panggil endpoint GraphQL dari DALAM konteks halaman
 * (cookie + header asli ikut terkirim), tanpa bergantung pada rendering.
 */
async function panggilGQLangsung(page, query) {
  const hasil = await page.evaluate(async ({ body, ua }) => {
    const r = await fetch('https://gql.tokopedia.com/graphql/SearchProductV5Query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-source': 'tokopedia-lite',
        'x-tkpd-lite-service': 'zeus',
        'user-agent': ua,
      },
      body,
    });
    const teks = await r.text();
    return { status: r.status, teks: teks.slice(0, 3000000) };
  }, { body: badanGQL(query), ua: UA });
  if (hasil.status !== 200) throw new Error(`GQL HTTP ${hasil.status}`);
  try { return JSON.parse(hasil.teks); } catch (_) { throw new Error('GQL bukan JSON'); }
}

/**
 * Jalur cadangan B: lewat APIRequestContext Playwright (tidak terikat batasan
 * CORS peramban, tetap memakai cookie konteks). Dipakai bila konteks halaman
 * belum berada di origin Tokopedia.
 */
async function panggilGQLRequest(ctx, query) {
  const resp = await ctx.request.post('https://gql.tokopedia.com/graphql/SearchProductV5Query', {
    headers: {
      'content-type': 'application/json',
      'x-source': 'tokopedia-lite',
      'x-tkpd-lite-service': 'zeus',
      origin: 'https://www.tokopedia.com',
      referer: 'https://www.tokopedia.com/',
      'user-agent': UA,
    },
    data: badanGQL(query),
    timeout: 45000,
  });
  if (!resp.ok()) throw new Error(`GQL HTTP ${resp.status()}`);
  return await resp.json();
}

/**
 * Ambil produk untuk beberapa kata kunci.
 * @param {object} opsi
 * @param {string[]} opsi.queries     daftar kata kunci
 * @param {number}   opsi.maxItems    batas total baris
 * @param {number}   opsi.maxScrolls  berapa kali menggulir per kata kunci
 * @param {number}   opsi.timeoutMs   batas waktu navigasi
 * @param {function} opsi.log         pemanggil log (default: senyap)
 */
async function scrapeTokopedia(opsi) {
  const queries = (opsi.queries || []).filter(Boolean);
  const maxItems = opsi.maxItems || 50;
  const maxScrolls = opsi.maxScrolls != null ? opsi.maxScrolls : 3;
  const timeoutMs = opsi.timeoutMs || 45000;
  const log = opsi.log || (() => {});
  const baris = [];
  const terlihat = new Set();

  const tambah = (produkList) => {
    for (const p of produkList) {
      const r = mapProduk(p);
      if (!r) continue;
      // Saring sampah: hanya baris yang benar-benar produk (punya harga DAN toko).
      // Ini membuang tautan navigasi/kategori yang ikut tersadap dari beranda.
      if (r.harga == null || !r.toko_nama) continue;
      const kunci = r.id || (r.nama + '|' + (r.toko_nama || ''));
      if (terlihat.has(kunci)) continue;
      terlihat.add(kunci);
      baris.push(r);
    }
  };

  // Beberapa cara peluncuran — Tokopedia kadang menolak HTTP/2 dari headless,
  // dan mode yang berhasil bisa berbeda antar-run (jaringan berubah).
  const caraPeluncuran = [
    { args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'] },
    { channel: 'chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] },
    { args: ['--no-sandbox', '--disable-http2', '--disable-blink-features=AutomationControlled'] },
  ];

  for (let idx = 0; idx < caraPeluncuran.length; idx++) {
    const cara = caraPeluncuran[idx];
    let browser;
    try {
      browser = await chromium.launch({ headless: true, args: cara.args, channel: cara.channel });
    } catch (e) {
      log(`peluncuran ${idx + 1} gagal: ${String(e.message).slice(0, 100)}`);
      continue;
    }

    let caraIniBerhasil = false;
    try {
      const ctx = await browser.newContext({
        locale: 'id-ID', timezoneId: 'Asia/Jakarta',
        viewport: { width: 1366, height: 900 }, userAgent: UA,
      });
      const page = await ctx.newPage();
      let diPencarian = false;
      page.on('framenavigated', (f) => {
        try { if (f === page.mainFrame()) diPencarian = /tokopedia\.com\/search/.test(f.url()); } catch (_) {}
      });
      page.on('response', async (resp) => {
        try {
          if (!diPencarian) return;              // hanya sadap saat di halaman pencarian
          if (!GQL_URL_HINT.test(resp.url())) return;
          if (!/json/i.test(resp.headers()['content-type'] || '')) return;
          const body = await resp.json().catch(() => null);
          if (body) tambah(ambilProduk(body));
        } catch (_) {}
      });

      // Buka beranda dulu supaya cookie/anti-bot terpasang, lalu ambil data.
      await bukaHalaman(page, 'https://www.tokopedia.com/', timeoutMs).catch(() => {});
      await page.waitForTimeout(1500);

      for (const q of queries) {
        if (baris.length >= maxItems) break;
        let dapat = 0;
        // 1) jalur utama: sadap render halaman
        try {
          diPencarian = true;
          await bukaHalaman(page, `https://www.tokopedia.com/search?q=${encodeURIComponent(q)}`, timeoutMs);
          await page.waitForTimeout(6000);
          const sebelum = baris.length;
          for (let s = 0; s < maxScrolls; s++) {
            if (baris.length >= maxItems) break;
            const n = baris.length;
            await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
            await page.waitForTimeout(2500);
            if (baris.length === n) break;
          }
          dapat = baris.length - sebelum;
        } catch (e) {
          log(`render gagal pada "${q}" (${String(e.message).slice(0, 70)}) — coba jalur GraphQL langsung`);
        }
        // 2) jalur cadangan: panggil GraphQL langsung dari konteks browser
        if (dapat === 0) {
          try {
            const body = await panggilGQLangsung(page, q);
            tambah(ambilProduk(body));
            log(`"${q}": ${baris.length} produk (jalur GraphQL langsung)`);
          } catch (e) {
            log(`GraphQL via halaman gagal pada "${q}": ${String(e.message).slice(0, 90)}`);
            try {
              const body2 = await panggilGQLRequest(ctx, q);
              tambah(ambilProduk(body2));
              log(`"${q}": ${baris.length} produk (jalur APIRequestContext)`);
            } catch (e2) {
              log(`APIRequestContext gagal pada "${q}": ${String(e2.message).slice(0, 90)}`);
            }
          }
          dapat = baris.length > 0 ? 1 : 0;
        } else {
          log(`"${q}": ${dapat} produk (jalur render)`);
        }
        if (dapat > 0) caraIniBerhasil = true;
      }
    } catch (e) {
      log(`cara ${idx + 1} error: ${String(e.message).slice(0, 120)}`);
    } finally {
      await browser.close();
    }

    if (baris.length >= Math.min(maxItems, 5) || (caraIniBerhasil && baris.length)) break;
  }

  return baris.slice(0, maxItems);
}

/** Baris -> CSV */
function keCSV(rows) {
  const kolom = ['id', 'nama', 'harga', 'harga_teks', 'harga_asli', 'diskon_pct', 'rating',
    'terjual', 'toko_id', 'toko_nama', 'toko_kota', 'toko_tier', 'toko_url', 'kategori',
    'kategori_jalur', 'iklan', 'url', 'gambar', 'diambil_pada'];
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [kolom.join(',')].concat(
    rows.map(r => kolom.map(k => esc(r[k])).join(','))
  ).join('\n');
}

module.exports = { scrapeTokopedia, keCSV, mapProduk, ambilProduk, angkaTerjual, angkaId };
