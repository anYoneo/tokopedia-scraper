# Tokopedia Scraper — Produk, Harga, Rating & Jumlah Terjual

Ambil data produk dari **Tokopedia**, marketplace terbesar Indonesia. Masukkan kata kunci, dapatkan baris produk siap pakai: harga, harga coret, persen diskon, rating, jumlah terjual, nama toko, kota toko, dan kategori.

**Sudah teruji:** 120 produk dari 2 kata kunci, kelengkapan 100% pada semua kolom harga/rating/terjual/toko/kota. Uji otomatis 7/7 lulus memakai payload nyata.

## Hasil nyata (bukan contoh buatan)

Satu baris dari dataset, apa adanya:

```json
{
  "id": "102459767201",
  "nama": "Sepatu Flash Series Public Low Black Natural Sepatu Sneakers Sekolah Cowok Cewek",
  "harga": 27400,
  "harga_teks": "Rp27.400",
  "harga_asli": 150000,
  "diskon_pct": 82,
  "rating": 4.6,
  "terjual": 10000,
  "toko_nama": "YOKATA.Id",
  "toko_kota": "Kab. Mojokerto",
  "toko_tier": 3,
  "toko_url": "https://www.tokopedia.com/yokataid",
  "kategori": "Fashion Pria",
  "kategori_jalur": "fashion-pria/sepatu-pria/sneakers-pria",
  "iklan": false,
  "url": "https://www.tokopedia.com/yokataid/sepatu-flash-series-...",
  "diambil_pada": "2026-10-12T07:34:37.185Z"
}
```

## Kolom

| Kolom | Isi |
|---|---|
| `id` | ID produk Tokopedia |
| `nama` | Nama produk |
| `harga` / `harga_teks` | Harga dalam Rupiah (**angka bulat** + teks asli) |
| `harga_asli` | Harga sebelum diskon (bila ada) |
| `diskon_pct` | Persentase diskon |
| `rating` | Rating rata-rata (1–5) |
| `terjual` | Jumlah unit terjual (**sudah jadi angka**) |
| `toko_id` / `toko_nama` / `toko_kota` / `toko_tier` / `toko_url` | Identitas penjual |
| `kategori` / `kategori_jalur` | Kategori produk |
| `iklan` | Apakah hasil berbayar |
| `url` / `gambar` | Tautan produk dan gambar utama |
| `diambil_pada` | Waktu pengambilan (ISO 8601) |

Harga sudah berupa angka Rupiah bulat — tidak perlu membersihkan titik ribuan lagi. Kolom `terjual` di situs muncul sebagai label teks (mis. `"3rb+ terjual"`); di sini sudah dinormalkan menjadi angka (`3000`). Ekspor ke **JSON, CSV, atau Excel** langsung dari dataset Apify, atau pakai lewat API.

## Cara pakai

Isi **queries** dengan kata kunci (boleh beberapa sekaligus). Atur **maxItems** sesuai kebutuhan.

```json
{
  "queries": ["sepatu", "kopi arabika"],
  "maxItems": 200
}
```

## Untuk apa

- **Riset harga & pemantauan kompetitor** — pantau perubahan harga dan posisi toko dari waktu ke waktu
- **Kurasi katalog** — kumpulkan nama, gambar, dan kategori produk
- **Analisis pasar** — siapa penjual terbesar di sebuah kategori, kota mana yang dominan
- **Peluang produk** — produk dengan penjualan tinggi tapi sedikit pesaing

## Catatan teknis

Pengambilan dilakukan dengan membuka halaman pencarian lewat peramban sungguhan dan membaca payload JSON internal Tokopedia (`SearchProductV5Query`), lalu memetakannya ke kolom di atas. Pendekatan ini jauh lebih tahan perubahan dibanding membaca markup HTML.

Ada tiga jalur otomatis dengan cadangan berlapis (sadap respons → GraphQL langsung dari konteks halaman → *request context*), karena Tokopedia kadang menolak HTTP/2 dari peramban tanpa kepala.

## Harga

**$0,90 per 1.000 hasil** (pay-per-result), plus biaya mulai Actor yang sangat kecil ($0,00005 per run). Biaya platform sudah termasuk — tidak ada tagihan terpisah dari Apify untuk compute.

Penghitungan biaya: jika Anda mengambil 3.000 produk, biayanya **$2,70**.

## Dukungan

Ada kolom tambahan yang Anda butuhkan, atau situs target berubah perilaku? Kirim pesan lewat tab Issues — perbaikan diutamakan untuk pelanggan berbayar.
