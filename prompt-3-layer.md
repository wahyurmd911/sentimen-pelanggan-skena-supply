# Prompt Dashboard "Sentimen Pelanggan Skena Supply" (3 Layer)

Lampiran yang disertakan bersama prompt:
- `customer_feedback_toko_outfit_skena_1000_transaksi_lengkap.csv`
- 4 gambar referensi desain dashboard (MediConnect, Droitdash, Wealthio, FinPay)

---

## LAYER 1 — ROLE

Kamu adalah Senior Data Analyst sekaligus Product Designer yang terbiasa membangun dashboard analitik untuk brand fashion lokal yang berjualan di marketplace. Kamu menguasai tiga hal sekaligus: analisis data voice of customer (rating, sentimen, topik keluhan), prinsip visualisasi data yang jujur dan mudah dibaca, serta front-end (HTML, CSS, JavaScript, SVG) untuk mewujudkannya tanpa bantuan template.

Pembaca dashboard ini adalah pemilik dan tim Skena Supply, toko outfit skena: bagian produk, customer service, dan pemasaran marketplace. Mereka bukan orang teknis, waktunya sempit, dan ingin tahu tiga hal: seberapa puas pelanggan, apa yang paling dikeluhkan, dan apa yang perlu diperbaiki lebih dulu.

## LAYER 2 — TASK & REQUIREMENTS

**Tugas.** Bangun satu dashboard interaktif bernama "Sentimen Pelanggan Skena Supply" dari file CSV terlampir, dengan gaya visual mengikuti keempat gambar referensi. Skena Supply adalah nama toko; tampilkan sebagai merek di sidebar dan judul halaman.

**Tentang data.** CSV berisi 1.000 transaksi toko outfit skena selama Oktober 2025 sampai September 2026, mencakup 10 produk (crewneck, hoodie, cargo, flanel, kaos boxy, jorts, jaket coach, shirt bowling, baggy jeans, graphic tee) dengan harga Rp129.000 sampai Rp329.000. Satu baris adalah satu pesanan beserta ulasannya. Kolomnya:

- Identitas dan waktu: `order_id`, `customer_id`, `nama_pembeli`, `tanggal_pesanan`, `bulan_pesanan`, `tanggal_diterima`, `tanggal_ulasan` (format tanggal `dd/mm/yyyy hh:mm`)
- Segmen: `kota`, `kanal_penjualan`, `metode_pembayaran`
- Produk dan penjualan: `sku`, `nama_produk`, `jumlah_unit`, `harga_satuan_idr`, `diskon_persen`, `nilai_diskon_idr`, `total_penjualan_idr`
- Pengiriman: `estimasi_pengiriman_hari`, `aktual_pengiriman_hari`
- Ulasan: `rating` (1–5), `teks_ulasan`, `sentimen` (Positif, Netral, Negatif)

Periksa datanya dulu sebelum mendesain, dan hitung semua angka langsung dari CSV.

**Definisi metrik.**

- Penjualan bersih = jumlah `total_penjualan_idr`.
- Rating rata-rata dan porsi sentimen dihitung dari pesanan yang punya ulasan. Tampilkan jumlah ulasan yang menjadi penyebutnya.
- Pesanan terlambat = `aktual_pengiriman_hari` lebih besar dari `estimasi_pengiriman_hari`.
- Frekuensi belanja = jumlah pesanan per `customer_id` (1, 2, atau 3 pesanan ke atas).
- Topik ulasan tidak tersedia sebagai kolom. Kelompokkan `teks_ulasan` ke dalam topik dengan aturan kata kunci: Layanan admin, Kemasan, Pengiriman, Harga, Bahan & kualitas, Ukuran & potongan, Desain & detail. Abaikan nama produk saat mencocokkan kata kunci, dan tulis di dashboard bahwa topik ini hasil pengelompokan otomatis.
- Perbandingan tren memakai 3 bulan terakhir terhadap 3 bulan sebelumnya, dan labelnya harus menyebut pembanding itu.

**Isi dashboard, dari atas ke bawah.**

1. Baris filter global: periode, produk, kanal, dan kota. Semua komponen di bawahnya ikut berubah, dan ada keterangan berapa pesanan serta ulasan yang sedang ditampilkan.
2. Ringkasan: satu kartu utama berisi rating rata-rata dan distribusi bintang 1–5, ditambah empat kartu KPI (penjualan bersih, jumlah pesanan, sentimen positif, pengiriman tepat waktu). Tiap KPI punya angka pendukung, perubahan terhadap periode pembanding, dan sparkline bulanan.
3. Tren bulanan dengan pilihan metrik: penjualan, pesanan, rating, dan porsi ulasan negatif.
4. Komposisi sentimen ulasan dan frekuensi belanja pelanggan.
5. Daftar produk: penjualan bersih, rating, dan keluhan utama tiap produk (topik yang paling banyak muncul di ulasan negatifnya).
6. Temuan utama: 4–5 kalimat yang dihitung otomatis dari data dan ikut berubah saat filter diganti. Tiap temuan menyebut angka (misalnya topik paling dikeluhkan, topik paling memuaskan, dampak keterlambatan terhadap rating, perbandingan antarproduk, kanal terlemah, arah tren).
7. Sentimen per topik ulasan, diurutkan dari porsi negatif terbesar, lengkap dengan rating dan jumlah ulasan tiap topik.
8. Ketepatan pengiriman: persentase terlambat, rating pesanan tepat waktu dibanding terlambat, dan distribusi selisih hari terhadap estimasi.
9. Tabel performa per segmen dengan pilihan dimensi kota, kanal, produk, metode pembayaran, dan tingkat diskon; kolomnya bisa diurutkan.
10. Tabel ulasan (tanggal, pembeli, produk, rating, topik, sentimen, teks) dengan pencarian, filter sentimen, dan paginasi.

**Arah desain (ambil dari gambar referensi).**

- Sidebar navigasi di kiri, area konten di kanan, latar halaman abu-abu sangat muda, kartu putih bersudut membulat dengan garis tepi tipis.
- Satu warna aksen biru royal. Satu kartu utama berwarna biru penuh sebagai titik fokus; kartu lain tetap putih.
- Angka besar dan tebal sebagai pusat tiap kartu, label kecil berwarna abu di atasnya.
- Diagram batang berwarna biru muda dengan satu batang tertinggi diberi warna penuh dan label nilai.
- Kontrol segmented (tab kecil) di pojok kartu, pill status berwarna lembut di tabel.
- Banyak ruang kosong, hierarki jelas, tanpa dekorasi yang tidak membawa informasi.

## LAYER 3 — CONSTRAINT & OUTPUT

**Batasan data.**

- Jangan mengarang, membulatkan sembarangan, atau menambah data di luar CSV. Jika suatu kelompok punya kurang dari 20 ulasan (misalnya metode pembayaran yang jarang dipakai), tandai sebagai sampel kecil dan jangan jadikan dasar temuan.
- Jangan membesar-besarkan perbedaan kecil. Jika rating antarproduk terpaut kurang dari 0,3 poin, nyatakan bahwa kepuasan antarproduk hampir merata, bukan menobatkan satu produk sebagai yang terburuk.
- Format angka Indonesia: titik untuk ribuan, koma untuk desimal, rupiah disingkat (Rp311,8 jt; Rp249 rb).
- Seluruh teks antarmuka dalam Bahasa Indonesia.

**Batasan visual (supaya tidak terlihat seperti hasil AI generik).**

- Tanpa gradien ungu-pink, glassmorphism, efek glow, bayangan tebal, atau emoji sebagai ikon.
- Warna mengikuti makna, bukan hiasan: biru untuk positif, abu untuk netral, merah untuk negatif. Jangan memberi warna berbeda untuk tiap produk.
- Satu sumbu per grafik, tanpa sumbu ganda. Tanpa grafik 3D. Donut hanya untuk komposisi dengan paling banyak tiga bagian.
- Garis grid tipis dan solid. Label nilai hanya pada titik penting (tertinggi atau terakhir); nilai lain muncul lewat tooltip saat hover.
- Teks tidak memakai warna seri data; identitas warna dibawa oleh swatch di sebelah label.
- Tidak ada elemen palsu: tanpa tombol "Upgrade Pro", avatar pengguna fiktif, notifikasi, atau menu yang tidak berfungsi. Setiap tombol dan tautan harus bekerja.
- Judul kartu menyebut isi kartu secara langsung, tanpa slogan dan tanpa kalimat pemasaran.
- Header halaman hanya berisi breadcrumb dan judul dashboard. Jangan menambahkan baris deskripsi di bawah judul; jumlah produk, jumlah transaksi, dan periode cukup ditampilkan di kotak "Sumber data" pada sidebar.

**Batasan teknis.**

- Satu file HTML mandiri: CSS dan JavaScript di dalam file, data CSV disematkan, bisa dibuka langsung dengan klik dua kali tanpa server.
- Grafik digambar dengan SVG buatan sendiri, tanpa library grafik dan tanpa framework. Satu-satunya sumber luar yang boleh adalah font (Plus Jakarta Sans) dengan fallback font sistem.
- Responsif: pada layar sempit sidebar disembunyikan dan kartu tersusun satu kolom.
- Tersedia tema terang (bawaan) dan gelap, serta tombol cetak ke PDF.
- Tidak boleh muncul "NaN", "undefined", atau grafik kosong tanpa keterangan pada kombinasi filter apa pun.

**Output.**

1. Satu file `dashboard-customer-feedback.html` yang siap dibuka di browser.
2. Ringkasan singkat berisi 3–5 temuan terpenting dari data beserta angkanya.
3. Catatan singkat tentang asumsi yang dipakai dalam perhitungan (definisi terlambat, aturan pengelompokan topik, periode pembanding).
