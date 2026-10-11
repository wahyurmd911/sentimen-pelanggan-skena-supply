"""Olah CSV transaksi menjadi data dashboard.

Menghasilkan dua keluaran:
1. assets/data.js                      -> data ringkas yang dibaca index.html
2. dashboard-customer-feedback.html    -> versi satu file (CSS, JS, dan data digabung)

Cara pakai (dari folder utama project):
    python scripts/build.py
"""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "customer_feedback_toko_outfit_skena_1000_transaksi_lengkap.csv"
STANDALONE = ROOT / "dashboard-customer-feedback.html"

# CSV tidak punya kolom topik ulasan, jadi topik diturunkan dari kata kunci pada teks.
# Urutan daftar ini adalah urutan prioritas: kecocokan pertama yang dipakai.
TOPIK = [
    ("Layanan admin", r"\badmin\b|\bcs\b|keluhan"),
    ("Kemasan", r"packing|bungkus|kemasan"),
    ("Pengiriman", r"paket|pengiriman|kirim|estimasi"),
    ("Harga", r"harga|worth|uang|dibayar"),
    ("Bahan & kualitas", r"bahan|kain|katun|fleece|nylon|denim|flanel|twill|jahitan|tebal|tipis|kasar|lembut|tekstur|retak|rontok|berbulu|luntur|adem|gerah|button|copot"),
    ("Ukuran & potongan", r"ukuran|size|bahu|lengan|pinggang|potongan|\bfit\b|longgar|panjang|pendek|kekecilan|ketat|sempit|layering|boxy|\bpas\b|jatuhnya|baggy"),
    ("Desain & detail", r"warna|sablon|kerah|kancing|saku|model|desain|gambar|motif|hood|resleting|detail|washed|efek"),
]
SENTIMEN = ["Positif", "Netral", "Negatif"]


def topik(row):
    """Indeks topik untuk satu ulasan; nama produk dibuang dulu agar tidak ikut tercocokkan."""
    teks = row["teks_ulasan"].replace(row["nama_produk"], " ").lower()
    for i, (_, pola) in enumerate(TOPIK):
        if re.search(pola, teks):
            return i
    return len(TOPIK)


def iso(tanggal):
    """'01/10/2025 11:56' -> '2025-10-01'."""
    return f"{tanggal[6:10]}-{tanggal[3:5]}-{tanggal[0:2]}"


def baca_data():
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    bulan = sorted({r["bulan_pesanan"] for r in rows})
    kota = sorted({r["kota"] for r in rows})
    kanal = sorted({r["kanal_penjualan"] for r in rows})
    bayar = sorted({r["metode_pembayaran"] for r in rows})
    produk = sorted({(r["nama_produk"], r["sku"], int(r["harga_satuan_idr"])) for r in rows})
    nama_produk = [p[0] for p in produk]
    nama_topik = [t[0] for t in TOPIK] + ["Lainnya"]

    # Tiap baris dipadatkan menjadi list; urutannya harus sama dengan pemetaan ROWS di assets/app.js.
    baris = []
    for r in rows:
        baris.append([
            r["order_id"], r["customer_id"], r["nama_pembeli"], iso(r["tanggal_pesanan"]),
            bulan.index(r["bulan_pesanan"]), kota.index(r["kota"]), kanal.index(r["kanal_penjualan"]),
            bayar.index(r["metode_pembayaran"]), nama_produk.index(r["nama_produk"]),
            int(r["jumlah_unit"]), int(r["diskon_persen"]), int(r["total_penjualan_idr"]),
            int(r["estimasi_pengiriman_hari"]), int(r["aktual_pengiriman_hari"]),
            int(r["rating"]) if r["rating"] else None,
            SENTIMEN.index(r["sentimen"]) if r["sentimen"] else -1,
            topik(r) if r["teks_ulasan"] else -1, r["teks_ulasan"],
            iso(r["tanggal_ulasan"]) if r["tanggal_ulasan"] else "", int(r["nilai_diskon_idr"]),
        ])
    if not any(b[16] == len(TOPIK) for b in baris):
        nama_topik.pop()

    return {
        "awal": min(b[3] for b in baris), "akhir": max(b[3] for b in baris),
        "months": bulan, "kota": kota, "kanal": kanal, "bayar": bayar,
        "produk": [{"nama": p[0], "sku": p[1], "harga": p[2]} for p in produk],
        "sent": SENTIMEN, "topik": nama_topik, "rows": baris,
    }


def main():
    data = baca_data()
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    data_js = f"const RAW = {blob};\n"
    (ROOT / "assets" / "data.js").write_text(data_js, encoding="utf-8")

    # Versi satu file: sisipkan CSS, data, dan JS ke dalam index.html.
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "assets" / "style.css").read_text(encoding="utf-8")
    app = (ROOT / "assets" / "app.js").read_text(encoding="utf-8")
    ganti = {
        '<link rel="stylesheet" href="assets/style.css">': f"<style>\n{css}</style>",
        '<script src="assets/data.js"></script>': f"<script>\n{data_js}</script>",
        '<script src="assets/app.js"></script>': f"<script>\n{app}</script>",
    }
    for lama, baru in ganti.items():
        assert lama in html, lama
        html = html.replace(lama, baru)
    STANDALONE.write_text(html, encoding="utf-8")

    print(f"{len(data['rows'])} baris -> assets/data.js dan {STANDALONE.name}")


if __name__ == "__main__":
    main()
