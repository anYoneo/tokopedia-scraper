# Teks listing & usulan harga — Apify Store

## Judul

**Tokopedia Scraper — Produk, Harga, Rating & Jumlah Terjual**

## Deskripsi singkat (untuk kartu store)

> Ambil data produk Tokopedia: harga Rupiah, diskon, rating, jumlah terjual, dan
> profil toko. Ekspor JSON/CSV/Excel. Untuk riset harga dan pemantauan kompetitor
> di marketplace terbesar Indonesia.

## Poin jual (yang membedakan dari 49 Actor Tokopedia lain)

1. **Kolom lengkap & sudah bersih** — harga langsung angka (`199900`, bukan `"Rp199.900"`),
   `terjual` sudah dinormalkan (`3rb+ terjual` → `3000`). Pesaing menyisakan teks mentah.
2. **Banyak kata kunci sekaligus** dalam satu kali jalan.
3. **Harga coret + persen diskon** ikut diambil — berguna untuk memantau promo.
4. **Identitas toko** (id, nama, kota, tier, url) — bisa untuk analisis penjual, bukan sekadar daftar produk.

## Usulan harga

| Paket | Isi | Harga |
|---|---|---|
| Uji coba | 100 hasil gratis (sekali) | $0 |
| Pay-per-result | ~$0,50 per 1.000 produk | $0,0005/hasil |
| Rental bulanan (opsional) | run tak terbatas dalam batas wajar | $9/bulan |

**Alasan pay-per-result sebagai utama:** pembeli data memakai sekali-sekali lalu
kembali; model ini menurunkan hambatan mencoba dan tetap adil saat volume besar.
Rental $9 ditawarkan sebagai pilihan untuk pemakaian rutin.

> Catatan: Store Apify mulai bermigrasi ke pay-per-usage pada 1 Oktober 2026 —
> pay-per-result sudah sejalan dan tidak akan terkena migrasi paksa.

## Kata kunci store (tags)

`tokopedia`, `ecommerce`, `indonesia`, `price monitoring`, `product data`,
`marketplace`, `competitor analysis`, `scraper`

## Gerbang ukur (sama seperti eksperimen sebelumnya)

14 hari setelah terbit. Baseline hari-0: pemakai 0, run 0, pendapatan $0.

- **Lanjut** bila: pemakai ≥ 25 DAN ada minimal 1 pelanggan berbayar
- **Kaji ulang** bila: pemakai 10–24 tapi 0 pembayaran → perbaiki deskripsi/kolom
- **Hentikan** bila: pemakai < 10 setelah 14 hari → kategori ini mati, jangan ulang
