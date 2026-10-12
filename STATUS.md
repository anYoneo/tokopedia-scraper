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
| Petunjuk Actor (`actor.json`, input & dataset schema, Dockerfile) | ✅ selesai |
| README listing | ✅ selesai |
| Publikasi ke Apify Store | ⏳ **butuh 1 klik Anda** (login/otorisasi Apify) |
| Harga | ⏳ disarankan **pay-per-result** (lihat `LISTING.md`) |
| Pendapatan | **Rp 0** — belum ada pelanggan, karena belum terbit |

## Langkah berikutnya (untuk saya, setelah Anda login)

1. `apify login` (token dari konsol) → `apify push` → Actor terbit
2. Set harga pay-per-result (mis. $0.5–1 per 1.000 hasil) + batas gratis uji coba
3. Ukur 14 hari: pemakai, run, konversi → putuskan lanjut atau hentikan
