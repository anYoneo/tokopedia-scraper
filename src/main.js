#!/usr/bin/env node
/**
 * main.js — pintu masuk Apify Actor "Tokopedia Scraper".
 *
 * Menjalankan scrape.js lalu menulis hasil ke dataset Apify.
 * Bisa juga dipakai lokal tanpa Apify:  node src/main.js --queries "sepatu" --out hasil.csv
 */
'use strict';

const fs = require('fs');
const { scrapeTokopedia, keCSV } = require('./scrape');

function arg(nama, bawaan) {
  const i = process.argv.indexOf('--' + nama);
  if (i === -1) return bawaan;
  const v = process.argv[i + 1];
  return (v == null || v.startsWith('--')) ? true : v;
}

function daftar(nama) {
  const i = process.argv.indexOf('--' + nama);
  if (i === -1) return null;
  const keluar = [];
  for (let j = i + 1; j < process.argv.length && !process.argv[j].startsWith('--'); j++) keluar.push(process.argv[j]);
  return keluar.length ? keluar : null;
}

(async () => {
  const diApify = !!process.env.APIFY_IS_AT_HOME;
  let ActorRef = null;

  // WAJIB: Actor.init() sebelum getInput/pushData. Tanpa ini SDK melempar
  // "Actor.getInput() was called but the Actor instance was not initialized"
  // dan pushData tidak menulis apa pun ke dataset.
  if (diApify) {
    const mod = require('apify');
    ActorRef = mod.Actor;
    await ActorRef.init();
  }

  // Kalau berjalan DI Apify, ambil input dari platform. Kalau tidak, dari argv.
  let queries = null, maxItems = 100, maxScrolls = 3;
  if (diApify) {
    const input = (await ActorRef.getInput()) || {};
    queries = Array.isArray(input.queries)
      ? input.queries
      : (input.query ? [input.query] : null);
    if (input.maxItems) maxItems = parseInt(input.maxItems, 10);
    if (input.maxScrolls != null) maxScrolls = parseInt(input.maxScrolls, 10);
  }

  if (!queries || !queries.length) {
    const queriesArg = daftar('queries') || (arg('query') && [arg('query')]) || null;
    queries = queriesArg || ['sepatu'];
    if (!diApify) {
      maxItems = parseInt(arg('maxItems', arg('limit', maxItems)), 10);
      maxScrolls = parseInt(arg('maxScrolls', maxScrolls), 10);
    }
  }
  const out = arg('out', null);

  const rows = await scrapeTokopedia({
    queries,
    maxItems,
    maxScrolls,
    log: (m) => console.log('[info]', m),
  });

  const hasil = {
    kata_kunci: queries,
    jumlah: rows.length,
    diambil_pada: new Date().toISOString(),
    produk: rows,
  };
  console.log(JSON.stringify({ jumlah: rows.length, contoh: rows.slice(0, 2) }, null, 1));

  if (out) {
    if (String(out).endsWith('.csv')) fs.writeFileSync(out, keCSV(rows), 'utf8');
    else fs.writeFileSync(out, JSON.stringify(hasil, null, 2), 'utf8');
    console.log('ditulis:', out);
  }

  // Simpan ke dataset Apify bila berjalan di platform
  if (diApify) {
    if (rows.length) {
      await ActorRef.pushData(rows);
      console.log('tersimpan ke dataset Apify:', rows.length);
    } else {
      console.warn('PERINGATAN: 0 produk — lihat log di atas untuk jalur yang gagal.');
    }
    await ActorRef.setValue('OUTPUT', {
      kata_kunci: queries,
      jumlah: rows.length,
      diambil_pada: hasil.diambil_pada,
    });
    await ActorRef.exit();
  }
})().catch(async (e) => {
  console.error('GAGAL:', String(e && e.stack || e).slice(0, 2000));
  try { const { Actor } = require('apify'); if (process.env.APIFY_IS_AT_HOME) await Actor.fail(String(e.message)); } catch (_) {}
  process.exit(1);
});
