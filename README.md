# Sentimen Pelanggan Skena Supply

Dashboard interaktif untuk membaca ulasan pelanggan Skena Supply, toko outfit skena. Data berisi 1.000 transaksi dari 10 produk selama Oktober 2025 sampai September 2026.

## Cara membuka

Buka `index.html` di browser. Tidak perlu server atau instalasi apa pun.

Tersedia juga `dashboard-customer-feedback.html`, yaitu versi satu file dengan CSS, JavaScript, dan data yang sudah digabung, supaya mudah dikirim atau dikumpulkan.

## Isi dashboard

- Filter periode, produk, kanal, dan kota yang berlaku untuk semua kartu
- Rating rata-rata, distribusi bintang, dan empat KPI dengan tren bulanan
- Komposisi sentimen dan frekuensi belanja pelanggan
- Penjualan, rating, dan keluhan utama tiap produk
- Temuan utama yang dihitung dari data sesuai filter aktif
- Sentimen per topik ulasan dan ketepatan pengiriman
- Tabel performa per kota, kanal, produk, metode pembayaran, dan diskon
- Tabel ulasan dengan pencarian dan filter sentimen

## Struktur project

```
index.html                          halaman dashboard
assets/style.css                    tampilan (tema terang dan gelap)
assets/app.js                       perhitungan metrik, grafik SVG, dan interaksi
assets/data.js                      data hasil olahan (dibuat oleh scripts/build.py)
data/                               file CSV sumber
scripts/build.py                    mengolah CSV menjadi assets/data.js dan versi satu file
dashboard-customer-feedback.html    versi satu file
prompt-3-layer.md                   prompt tiga lapis yang dipakai
```

## Memperbarui data

Ganti file CSV di folder `data/`, lalu jalankan:

```
python scripts/build.py
```

Skrip hanya memakai pustaka bawaan Python.

## Catatan perhitungan

- Rating dan porsi sentimen dihitung dari pesanan yang punya ulasan.
- Pesanan terlambat adalah pesanan dengan hari pengiriman aktual lebih besar dari estimasi.
- Topik ulasan tidak tersedia sebagai kolom di CSV. Topik dikelompokkan dari kata kunci pada teks ulasan; aturannya ada di `scripts/build.py`.
- Kelompok dengan kurang dari 20 ulasan ditandai sebagai sampel kecil dan tidak dipakai sebagai dasar temuan.
- Perubahan pada kartu KPI membandingkan 3 bulan terakhir dengan 3 bulan sebelumnya.
