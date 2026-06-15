# Lamira Dashboard

Sistem manajemen kebun untuk Kebun Lamira (~35 ha, Sulawesi Tengah). Dibangun dengan Next.js 16, Supabase, dan Tailwind CSS.

## Modul

| Modul | Deskripsi |
|-------|-----------|
| Bebek & Telur | Produksi harian, pengasinan, penjualan, HPP |
| Tanaman | 7 blok tanam, log kerja, jadwal perawatan |
| Pembangunan | Proyek, milestone, anggaran vs realisasi |
| Penggajian | Karyawan, presensi, kalkulasi gaji otomatis |
| Stok Pakan | Inventaris pakan, pembelian, alert stok rendah |
| Pengaturan | Google Sheets sync, ekspor PDF |

## Tech Stack

- **Framework**: Next.js 16.2 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: shadcn/ui dengan Base UI, Tailwind CSS v4
- **Charts**: Recharts
- **PDF**: @react-pdf/renderer
- **Deploy**: Vercel

## Setup Lokal

```bash
# Install dependencies
npm install

# Copy env template
cp .env.local.example .env.local
# Isi nilai dari Supabase Dashboard → Settings → API

# Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Setup Database

1. Buka Supabase SQL Editor di project Anda
2. Jalankan file `supabase/migrations/RUN_IN_SQL_EDITOR.sql` (copy-paste seluruh isi)
3. Login ke app dengan email/password yang dibuat di Supabase → Authentication → Users

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "feat: initial Lamira Dashboard"
git remote add origin https://github.com/USERNAME/lamira-dashboard.git
git push -u origin main
```

### 2. Import di Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repository GitHub
3. Framework akan terdeteksi otomatis sebagai **Next.js**

### 3. Environment Variables

Di Vercel → Settings → Environment Variables, tambahkan:

| Variable | Nilai |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (rahasia) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email service account Google (opsional) |
| `GOOGLE_PRIVATE_KEY` | Private key JSON service account (opsional) |
| `GOOGLE_SPREADSHEET_ID` | ID Google Spreadsheet (opsional) |

> **Catatan untuk `GOOGLE_PRIVATE_KEY`**: Saat menambahkan ke Vercel, ganti newline literal dalam file JSON dengan karakter `\n`. Vercel akan mengekspansinya kembali saat runtime.

### 4. Deploy

Klik **Deploy**. Build ~1-2 menit. Setiap push ke `main` akan re-deploy otomatis.

## Google Sheets Sync (Opsional)

1. Buat Google Cloud Project → aktifkan **Google Sheets API**
2. Buat Service Account → download JSON key
3. Buka Google Spreadsheet Anda → Share → tambahkan email service account sebagai **Editor**
4. Isi 3 env vars Google di atas
5. Di app: Pengaturan → klik **Sinkronkan Semua**

## Ekspor PDF

- **Bebek & Telur**: tombol "Ekspor PDF" di halaman Bebek → laporan produksi + penjualan bulan ini
- **Penggajian**: tombol "Ekspor PDF" di halaman Penggajian → slip gaji bulanan semua karyawan

## Struktur Folder

```
app/
  (auth)/login/        # Login page
  (dashboard)/         # Semua halaman utama
    page.tsx           # Beranda dengan live data
    bebek/             # Modul Bebek & Telur
    tanaman/           # Modul Tanaman
    pembangunan/       # Modul Pembangunan
    penggajian/        # Modul Penggajian
    stok-pakan/        # Modul Stok Pakan
    pengaturan/        # Settings + Sync
  api/
    pdf/bebek/         # PDF export bebek
    pdf/penggajian/    # PDF export penggajian
    sync/[module]/     # Google Sheets sync
components/            # Semua komponen UI
lib/
  supabase/            # Supabase clients (server/browser/admin)
  sheets/              # Google Sheets client
  pdf/                 # PDF templates
  utils/format.ts      # Format Rupiah, tanggal, dll
supabase/migrations/   # SQL migrations + seed data
types/index.ts         # Semua TypeScript types
proxy.ts               # Auth middleware (Next.js 16)
```
