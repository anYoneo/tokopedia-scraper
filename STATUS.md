# Tokopedia Scraper — status & bukti

Dibuat: 2026-10-12 · Lokasi kode: `C:\Users\bowol\tokopedia-actor`

## Apa ini

Satu produk: **pengambil data produk Tokopedia** yang dibungkus sebagai **Apify Actor**
(canvas Apify), bisa juga dijalankan sendiri lewat CLI.

## Kenapa kanal ini (bukan API data makro sebelumnya)

Diukur langsung dari API store Apify (data publik, 2026-10-12):

| Bukti | Angka |
|---|---|
| Apify membayar ke pembuat Actor | **$1,6 juta/bulan**, bagi hasil **80%** untuk developer |
| Pelanggan berbayar Apify | **25.000+** |
| Kategori paling laku (jobs, LinkedIn) — 1 Actor teratas | **170.420 pemakai**, 4,27 juta run |
| Shopee Scraper (pasar Indonesia) — teratas | **2.878 pemakai**, 283 pemakai/30 hari |
| Lazada Scraper — teratas | **500 pemakai** |
| **Tokopedia** — teratas | **211 pemakai** (pasokan pecah: 49 Actor, tanpa pemimpin) |

Pola pendapatan: **1 pelanggan ≈ 3.000–10.000 run/bulan**.

Kesimpulan: permintaan untuk data marketplace Indonesia **terbukti ada dan dibayar**
(Shopee 2.878 pemakai), tapi **Tokopedia belum ada yang menguasai** — 49 Actor dengan
yang teratas hanya 211 pemakai. Itulah celah yang dikerjakan.

## Bukti bahwa produknya benar-benar bekerja

Bukan klaim — hasil eksekusi nyata:

- **120 produk** terambil dari 2 kata kunci (`sepatu`, `kopi arabika`)
- **Kelengkapan kolom**: harga **100%**, rating **100%**, jumlah terjual **100%**,
  nama toko **100%**, kota toko **100%**, kategori **95%**, diskon **75–100%**
- **90 id unik, 67 toko unik** — tanpa duplikasi
- **Stabil**: 2 kali jalan berturut-turut, 60 produk, kelengkapan 100%
- **Uji otomatis**: **7/7 lulus** (`node --test test/parse.test.js`) memakai payload nyata

## Cara kerjanya

1. Buka halaman pencarian Tokopedia dengan Chromium sungguhan (Playwright)
2. Sadap respons JSON internal `gql.tokopedia.com/graphql/SearchProductV5Query`
   yang dipakai situsnya sendiri — jauh lebih tahan perubahan daripada parsing HTML
3. Petakan payload ke kolom bersih (harga jadi angka Rupiah; "3rb+ terjual" → 3000)
4. Tulis ke dataset Apify → pelanggan unduh sebagai JSON/CSV/Excel

Tiga jalur otomatis dengan cadangan berlapis (render → GraphQL via halaman →
GraphQL via APIRequestContext), karena Tokopedia kadang menolak HTTP/2 dari
peramban tanpa kepala.

## Status

| | |
|---|---|
| Kode | ✅ selesai & teruji |
| Petunjuk Actor (`actor.json`, input/dataset/output schema, Dockerfile) | ✅ selesai |
| README listing | ✅ selesai |
| **Publikasi ke Apify Store** | ✅ **TERBIT** 2026-10-12 — `https://apify.com/anyoneo/tokopedia-scraper` |
| Harga | ⏳ hanya "Pay per usage"; monetisasi belum aktif (lihat bawah) |
| Pendapatan | **Rp 0** — belum ada pelanggan |

## Bukti terbit (terverifikasi via API publik, bukan klaim)

```
GET /v2/acts/2s1jFBrgg5VxSaHES  ->  isPublic: True
GET https://apify.com/anyoneo/tokopedia-scraper  ->  HTTP 200
ikat: title "Tokopedia Scraper — Produk, Harga, Rating & Jumlah Terjual · Apify"
Kategori store: "Research markets & competitors"
```

Build terbit `1.0.6` dijalankan ulang di cloud: **30 produk, kelengkapan ~100%**
(harga, rating, terjual, toko, kota, diskon 100%; kategori 96%).

## Rintangan yang sudah dilewati saat publikasi (jangan diulang)

1. **`Actor.init()` wajib** — tanpa itu `getInput()` gagal dan `pushData()` tidak
   menulis apa pun, padahal log tetap bilang "tersimpan". Gejala: run SUCCEEDED
   tapi dataset `itemCount: 0`.
2. **`package-lock.json` dilarang ikut** — npm di dalam image tidak bisa menimpanya
   (`EACCES /home/myuser`) → build gagal exit 243.
3. **Versi Playwright harus cocok** dengan Chromium di image Apify → tiap mode
   peluncuran dicoba juga dengan `channel: chromium` / `chrome`.
4. **`actor.json` wajib pakai kunci `inputSchema`** (bukan `input`) dan
   **`outputSchema`** — tanpa `outputSchema`, tombol Publish diblokir dengan pesan
   `Add "Output" schema(s) to the source code and rebuild`.
5. **Profil Apify wajib publik + README profil wajib diganti** — README default
   (template 591 karakter) membuat form profil menolak submit secara diam-diam;
   `isProfilePublic` tetap `false`. Setelah README diisi, submit langsung jalan.
6. **Klik di konsol Apify butuh urutan benar:** `scrollIntoView` → tunggu ~3 detik
   sampai scroll berhenti → `elementFromPoint` untuk cek elemen teratas benar →
   `click_at_xy` dengan koordinat itu. `element.click()` via JS tidak didaftarkan
   React; tombol sering ditutupi modal bantuan (tutup dengan Cancel dulu).

## Langkah berikutnya

1. Aktifkan monetisasi (**satu langkah manual di konsol Apify**; tidak ada API-nya):
   `https://console.apify.com/actors/2s1jFBrgg5VxSaHES/publication/monetize`
   → set **pay-per-result** (mis. $0,50–1 per 1.000 hasil) + kuota uji coba gratis.
   Catatan: perubahan monetisasi butuh **14 hari** untuk berlaku.
2. Catat baseline hari-0 dan ukur 14 hari: pemakai, run, konversi → lanjut atau hentikan.
3. Tuliskan README Actor yang lebih menjual (contoh output nyata, kasus pakai).
