/**
 * Uji parsing dengan payload NYATA (fixtures/payload-contoh.json hasil sadapan
 * SearchProductV5Query). Tujuannya mengunci pemetaan supaya perubahan bentuk
 * payload langsung ketahuan, bukan diam-diam menghasilkan kolom kosong.
 *
 * Jalankan: node --test test/
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { ambilProduk, mapProduk, angkaTerjual, angkaId, keCSV } = require('../src/scrape');

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'payload-contoh.json'), 'utf8'));

test('ambilProduk menemukan daftar produk dari payload asli', () => {
  const list = ambilProduk(fixture.body);
  assert.ok(list.length >= 20, `harus menemukan banyak produk, dapat ${list.length}`);
  assert.ok(list[0].name, 'produk pertama punya nama');
  assert.ok(list[0].price && typeof list[0].price.number === 'number', 'produk punya price.number');
});

test('mapProduk memetakan kolom inti dengan benar', () => {
  const list = ambilProduk(fixture.body);
  const baris = list.map(mapProduk).filter(Boolean);
  assert.ok(baris.length >= 20);

  const denganHarga = baris.filter(r => typeof r.harga === 'number' && r.harga > 0);
  assert.strictEqual(denganHarga.length, baris.length, 'SEMUA baris harus punya harga angka');

  const denganToko = baris.filter(r => r.toko_nama);
  assert.ok(denganToko.length / baris.length > 0.9, 'mayoritas baris punya nama toko (>90%)');

  const denganKota = baris.filter(r => r.toko_kota);
  assert.ok(denganKota.length / baris.length > 0.9, 'mayoritas baris punya kota toko');

  // rating di payload berupa string -> wajib jadi angka atau null (bukan string)
  for (const r of baris) {
    assert.ok(r.rating === null || typeof r.rating === 'number', 'rating berupa angka/null');
    if (r.rating !== null) assert.ok(r.rating >= 0 && r.rating <= 5, 'rating dalam rentang 0-5');
    assert.ok(r.url === null || /^https?:\/\//.test(r.url), 'url berbentuk tautan');
  }
});

test('terjual diparsing dari label teks "N terjual"', () => {
  const list = ambilProduk(fixture.body);
  const baris = list.map(mapProduk).filter(Boolean);
  const adaTerjual = baris.filter(r => typeof r.terjual === 'number');
  assert.ok(adaTerjual.length > 0, 'setidaknya sebagian produk punya angka terjual');
  for (const r of adaTerjual) {
    assert.ok(Number.isInteger(r.terjual) && r.terjual >= 0, 'terjual bilangan bulat >= 0');
  }
});

test('angkaTerjual menangani bentuk teks yang mungkin muncul', () => {
  assert.strictEqual(angkaTerjual('1 terjual'), 1);
  assert.strictEqual(angkaTerjual('100+ terjual'), 100);
  assert.strictEqual(angkaTerjual('3rb+ terjual'), 3000);
  assert.strictEqual(angkaTerjual('10jt terjual'), 10000000);
  assert.strictEqual(angkaTerjual('Rp199.900'), null);
  assert.strictEqual(angkaTerjual(null), null);
});

test('angkaId membersihkan format Rupiah Indonesia', () => {
  assert.strictEqual(angkaId('Rp1.029.000'), 1029000);
  assert.strictEqual(angkaId('Rp74.900'), 74900);
  assert.strictEqual(angkaId(199900), 199900);
  assert.strictEqual(angkaId(''), null);
});

test('keCSV menghasilkan header dan jumlah baris yang benar', () => {
  const baris = ambilProduk(fixture.body).map(mapProduk).filter(Boolean).slice(0, 5);
  const csv = keCSV(baris);
  const garis = csv.split('\n');
  assert.strictEqual(garis.length, baris.length + 1, 'header + satu baris per produk');
  assert.ok(garis[0].startsWith('id,nama,harga'), 'header diawali kolom inti');
  // kolom mengandung koma harus terbungkus kutip ganda (mengakhiri dengan ",)
  const adaKoma = baris.some(r => (r.nama || '').includes(','));
  if (adaKoma) {
    assert.ok(csv.includes('",'), 'nama berkoma dibungkus kutip ganda');
    assert.ok(/"[^"]*,[^"]*"/.test(csv), 'koma di dalam field berada di antara kutip');
  }
});

test('mapProduk tahan terhadap masukan kosong/aneh', () => {
  assert.strictEqual(mapProduk(null), null);
  assert.strictEqual(mapProduk('bukan objek'), null);
  assert.strictEqual(mapProduk({}), null, 'objek tanpa id dan nama diabaikan');
  // objek minimal tetap menghasilkan baris
  const r = mapProduk({ id: '1', name: 'Uji', price: { number: 1000 }, shop: { name: 'Toko' } });
  assert.strictEqual(r.harga, 1000);
  assert.strictEqual(r.toko_nama, 'Toko');
});
