# 🗺️ Web GIS Akses Permukiman terhadap Fasilitas Kesehatan di City of Cape Town

## Deskripsi

Aplikasi Web GIS interaktif yang menampilkan analisis akses permukiman terhadap fasilitas kesehatan di City of Cape Town, Afrika Selatan. Peta ini memvisualisasikan hasil analisis buffer jarak 1 km dan 3 km dari fasilitas kesehatan (rumah sakit, klinik, dan farmasi) untuk mengidentifikasi permukiman yang memiliki akses dekat, sedang, dan rendah terhadap layanan kesehatan.

### Tujuan
- Menampilkan lokasi rumah sakit dan klinik/farmasi di City of Cape Town
- Menunjukkan zona akses berdasarkan analisis buffer:
  - **Zona Hijau** — Akses dekat (≤ 1 km dari fasilitas kesehatan)
  - **Zona Kuning** — Akses sedang (1–3 km dari fasilitas kesehatan)
  - **Zona Merah** — Akses rendah (> 3 km dari fasilitas kesehatan)
- Membantu identifikasi area yang membutuhkan peningkatan akses layanan kesehatan

## Tech Stack

- **React** + **Vite** — Framework & build tool
- **Leaflet** + **react-leaflet** — Peta interaktif
- **CartoDB Positron** — Basemap (dengan opsi OpenStreetMap & CartoDB Dark)
- **CSS Custom** — Styling tanpa framework CSS eksternal

## Daftar Layer Data

| No | Layer | File GeoJSON | Warna |
|----|-------|-------------|-------|
| 1 | Rumah Sakit | `rumah_sakit.geojson` | 🔴 Merah (#D62828) |
| 2 | Klinik dan Farmasi | `klinik_farmasi.geojson` | 🔵 Biru (#0077B6) |
| 3 | Permukiman Akses Rendah (> 3 km) | `pemukiman_akses_rendah.geojson` | 🟥 Merah (#E85D5D) |
| 4 | Permukiman Akses Dekat (≤ 1 km) | `pemukiman_akses_dekat.geojson` | 🟩 Hijau (#6CC24A) |
| 5 | Permukiman Akses Sedang (1–3 km) | `pemukiman_akses_sedang.geojson` | 🟨 Kuning (#F2C94C) |
| 6 | Area Permukiman | `area_pemukiman.geojson` | 🩷 Pink (#F7C6C7) |
| 7 | Jalan Utama | `jalan_utama.geojson` | ⬜ Abu-abu (#8A8A8A) |
| 8 | Batas City of Cape Town | `batas_cape_town.geojson` | ⬛ Hitam (#222222) |

## Cara Menjalankan Lokal

### Prasyarat
- **Node.js** versi 18+ terinstal
- **npm** (biasanya sudah termasuk dengan Node.js)

### Langkah-langkah

```bash
# 1. Masuk ke folder proyek
cd webgis-cape-town

# 2. Install dependencies
npm install

# 3. Jalankan development server
npm run dev
```

Buka browser dan akses `http://localhost:5173`

## Cara Deploy ke Vercel

### Opsi 1: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Opsi 2: Deploy via GitHub

1. Push repository ke GitHub
2. Buka [vercel.com](https://vercel.com) dan login
3. Klik **"New Project"**
4. Import repository dari GitHub
5. Vercel akan otomatis mendeteksi framework Vite
6. Klik **"Deploy"**

### Konfigurasi Build (otomatis terdeteksi)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Fitur

- ✅ Peta interaktif dengan zoom & pan
- ✅ Layer control (on/off untuk setiap layer)
- ✅ Popup informasi pada setiap fitur
- ✅ Legenda warna di kanan bawah
- ✅ Header dengan judul dan subjudul
- ✅ Info panel tentang tujuan peta
- ✅ Tombol Reset View ke City of Cape Town
- ✅ Statistik jumlah fasilitas kesehatan
- ✅ 3 pilihan basemap (CartoDB Positron, Dark Matter, OSM)
- ✅ Responsif (desktop & mobile)
- ✅ Error handling — tidak error jika file GeoJSON belum tersedia

## Sumber Data

- **HOTOSM Export / OpenStreetMap** — Data jalan dan area permukiman
- **City of Cape Town Health Facilities** — Data fasilitas kesehatan (rumah sakit, klinik, farmasi)
- **CartoDB Positron / OpenStreetMap** — Basemap

## Struktur Proyek

```
webgis-cape-town/
├── public/
│   └── data/
│       ├── rumah_sakit.geojson
│       ├── klinik_farmasi.geojson
│       ├── pemukiman_akses_rendah.geojson
│       ├── pemukiman_akses_dekat.geojson
│       ├── pemukiman_akses_sedang.geojson
│       ├── area_pemukiman.geojson
│       ├── jalan_utama.geojson
│       └── batas_cape_town.geojson
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   └── App.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Lisensi

Proyek ini dibuat untuk keperluan akademik — mata kuliah SIF 42 Kartografi dan Sistem Informasi Geografis, Universitas Bakrie.
