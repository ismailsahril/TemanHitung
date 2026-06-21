# 🧮 TemanHitung — Aplikasi Latihan Hitung Mental

<p align="center">
  <img src="assets/icon.png" alt="TemanHitung Logo" width="96" />
</p>

<p align="center">
  <strong>Latihan matematika yang menyenangkan untuk semua usia — bergaya RPG, ada pet teman belajar, dan simulasi kasir warung!</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Android-3DDC84?style=flat-square&logo=android&logoColor=white" />
  <img src="https://img.shields.io/badge/built%20with-React%20%2B%20TypeScript-3178C6?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/mobile-Capacitor-119EFF?style=flat-square&logo=capacitor&logoColor=white" />
  <img src="https://img.shields.io/badge/version-1.0.0-amber?style=flat-square" />
</p>

---

## 📖 Tentang Aplikasi

**TemanHitung** adalah aplikasi latihan hitung mental berbasis mobile yang dirancang khusus untuk pengguna Indonesia. Dengan tampilan bergaya game RPG/fantasi, latihan matematika terasa seperti bermain game — bukan belajar yang membosankan.

Aplikasi ini cocok untuk:
- 🧒 **Anak-anak** yang sedang belajar berhitung
- 👩‍👧 **Orang tua** yang ingin mendampingi belajar anak
- 🏪 **Pemilik warung / kasir** yang ingin mengasah kemampuan hitung cepat
- 🧠 **Siapa saja** yang ingin melatih kemampuan berhitung sehari-hari

---

## ✨ Fitur Utama

### 🎯 Mode Latihan Biasa
Latihan 4 operasi matematika dengan 3 tingkat kesulitan:

| Operasi | Mudah | Sedang | Susah |
|---|---|---|---|
| ➕ Penjumlahan | Angka kecil | Angka menengah | Angka besar |
| ➖ Pengurangan | Bilangan bulat | Bilangan bulat | Bilangan bulat/desimal |
| ✖️ Perkalian | Satu digit | Dua digit | Dua digit kompleks |
| ➗ Pembagian | Satu digit | Dua digit | Dua digit kompleks |

### 🏪 Mode Kasir Warung
Simulasi menjadi kasir warung kelontong Indonesia:
- Hitung **total belanjaan** dari beberapa item dengan harga berbeda
- Hitung **uang kembalian** yang tepat dari pembayaran pelanggan
- Pelanggan membayar dengan pecahan Rupiah nyata (Rp1.000 – Rp100.000)
- Ada **voucher diskon** (kupon) sebagai tantangan tambahan
- **Kesabaran pelanggan** berkurang jika terlalu lama — kerjakan cepat untuk bonus koin!

### 🐾 Sistem Pet Teman Belajar
Adopsi hewan peliharaan virtual sebagai teman belajar:
- 🐱 **Kiko** — Si Kucing Pemberani
- 🐹 **Hami** — Si Hamster Rajin
- 🐰 **Mochi** — Si Kelinci Ceria
- 🦊 **Kiba** — Si Rubah Cerdik
- 🐦 **Piko** — Si Burung Semangat
- 🐒 **Momo** — Si Monyet Jenaka

Pet mendapatkan **EXP** setiap sesi latihan, naik level, dan bisa dilengkapi dengan upgrade dari **Toko Koin Warung**.

### 💡 Tips Hitung Cepat
Setiap soal dilengkapi tips strategi perhitungan cepat — tanpa membocorkan jawaban. Misalnya:
- Teknik pembulatan ke puluhan terdekat
- Trik perkalian ×5 (kalikan 10, bagi 2)
- Trik perkalian ×9 (kalikan 10, kurangi sekali)
- Pecah puluhan dan satuan terpisah

### ⚙️ Pengaturan Lengkap
- 🌙 Tema Terang / Gelap / Ikut Sistem
- ⏱️ Timer per soal (15 / 30 / 60 detik / tanpa timer)
- 📳 Haptic feedback
- 🔊 Suara efek
- 🌏 Bahasa Indonesia & English
- 📊 Statistik akurasi per operasi & tingkat kesulitan
- 📈 Grafik skor 10 sesi terakhir

---

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|---|---|
| [React 18](https://react.dev) + [TypeScript](https://typescriptlang.org) | UI framework & type safety |
| [Vite 5](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS 3](https://tailwindcss.com) | Styling |
| [Framer Motion 11](https://www.framer.com/motion/) | Animasi & transisi |
| [Capacitor 5](https://capacitorjs.com) | Wrapper native Android |
| [Lucide React](https://lucide.dev) | Icon library |
| [@capacitor/haptics](https://capacitorjs.com/docs/apis/haptics) | Haptic feedback |
| [@capacitor/preferences](https://capacitorjs.com/docs/apis/preferences) | Penyimpanan lokal persistent |

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- Node.js ≥ 18
- npm

### Langkah-langkah

```bash
# 1. Clone repository
git clone https://github.com/username/TemanHitung.git
cd TemanHitung

# 2. Install dependencies
npm install

# 3. Jalankan development server
npm run dev
```

Buka browser di `http://localhost:5173`

---

## 📱 Build untuk Android

### Prasyarat Tambahan
- Java 17 (JDK)
- Android Studio dengan Android SDK API 24+
- Perangkat Android (USB Debugging aktif) atau emulator

### Langkah Build

```bash
# 1. Build aplikasi web
npm run build

# 2. Sync dengan Capacitor
npm run cap:sync

# 3. Buka di Android Studio
npm run cap:open
```

Di Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

#### Build APK via CLI (Windows):
```powershell
cd android
.\gradlew.bat assembleDebug
```

APK tersedia di: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Atau langsung jalankan ke perangkat:
```bash
npm run cap:run
```

---

## 📂 Struktur Proyek

```
TemanHitung/
├── src/
│   ├── components/       # Komponen UI (GameBoard, WarungBoard, MainMenu, dll)
│   ├── hooks/            # Custom hooks (useSessionReducer, useSettings, usePet, dll)
│   ├── i18n/             # File terjemahan (id.ts, en.ts)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions (mathEngine, dll)
├── android/              # Native Android project (Capacitor)
├── assets/               # Asset gambar & ikon
└── public/               # File statis
```

---

## 🤝 Kontribusi

Kontribusi sangat disambut! Silakan:
1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b fitur/nama-fitur`)
3. Commit perubahan (`git commit -m 'Tambah fitur X'`)
4. Push ke branch (`git push origin fitur/nama-fitur`)
5. Buat Pull Request

---

## 📄 Lisensi

Proyek ini dibuat untuk tujuan edukasi dan belajar. Bebas digunakan dan dimodifikasi.

---

<p align="center">
  Dibuat dengan ❤️ untuk membantu belajar matematika jadi lebih menyenangkan 🧮
</p>
