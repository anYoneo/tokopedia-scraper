# Tokopedia Scraper — Produk, Harga, Rating & Jumlah Terjual

Ambil data produk dari **Tokopedia**, marketplace terbesar Indonesia. Masukkan kata kunci, dapatkan baris produk siap pakai: harga, harga coret, persen diskon, rating, jumlah terjual, nama toko, kota toko, dan kategori.

## Apa yang Anda dapat

| Kolom | Isi |
|---|---|
| `nama` | Nama produk |
| `harga` / `harga_teks` | Harga dalam Rupiah (angka + teks asli) |
| `harga_asli` | Harga sebelum diskon (bila ada) |
| `diskon_pct` | Persentase diskon |
| `rating` | Rating rata-rata (1–5) |
| `terjual` | Jumlah unit terjual |
| `toko_nama` / `toko_kota` / `toko_url` | Identitas penjual |
| `kategori` / `kategori_jalur` | Kategori produk |
| `iklan` | Apakah hasil berbayar |
| `url` / `gambar` | Tautan produk dan gambar utama |

Ekspor ke **JSON, CSV, atau Excel** langsung dari dataset Apify, atau pakai lewat API.

## Cara pakai

Isi **queries** dengan kata kunci (boleh beberapa sekaligus). Atur **maxItems** sesuai kebutuhan.

```json
{
  "queries": ["sepatu", "kopi arabika"],
  "maxItems": 200
}
```

## Untuk apa

- **Riset harga & pemantauan kompetitor** — pantau perubahan harga dan posisi toko
- **Kurasi katalog** — kumpulkan nama, gambar, dan kategori produk
- **Analisis pasar** — siapa penjual terbesar di sebuah kategori, kota mana yang dominan
- **Peluang produk** — produk dengan penjualan tinggi tapi sedikit pesaing

## Catatan teknis

Pengambilan dilakukan dengan membuka halaman pencarian lewat peramban sungguhan dan membaca payload JSON internal Tokopedia (`SearchProductV5Query`), lalu memetakannya ke kolom di atas. Pendekatan ini jauh lebih tahan perubahan dibanding membaca markup HTML.

Harga sudah berupa angka Rupiah bulat — tidak perlu membersihkan titik ribuan lagi. Kolom `terjual` di situs muncul sebagai label teks (mis. "3rb+ terjual"); di sini sudah dinormalkan menjadi angka (3000).

## Dukungan

Ada kolom tambahan yang Anda butuhkan, atau situs target berubah perilaku? Kirim pesan lewat tab Issues — perbaikan diutamakan untuk pelanggan berbayar.
