# Susi Air Pilot App — Backend API

REST API berbasis **NestJS 12** untuk aplikasi **Susi Air Pilot App**, dikonsumsi frontend **Nuxt 3**.
Backend **tidak menggunakan database** — seluruh data dibaca dari file JSON di `mocks/` saat
bootstrap (in-memory). Proyek ini merupakan assessment.

**Status:** starter NestJS → **sedang diimplementasikan** sesuai `docs/PRD.md`.
Kontrak API, acceptance criteria, dan decision log ada di `docs/PRD.md`.

---

## Tech Stack

| Item | Nilai |
|---|---|
| Framework | NestJS 12 |
| Bahasa | TypeScript (ESM, `module: nodenext`) |
| Runtime | Node.js 24, pnpm 11 |
| Autentikasi | `@nestjs/jwt` (Bearer token) |
| Utilitas tanggal | `dayjs` |
| Validasi | `class-validator`, `class-transformer` |
| Test runner | Vitest |
| Lint / Format | oxlint / Prettier |

---

## Prasyarat

- **Node.js** 24+
- **pnpm** 11+

---

## Setup & Menjalankan

```bash
# 1. Install dependency
pnpm install

# 2. Jalankan development (watch mode)
pnpm start:dev
```

Server berjalan di `http://localhost:3001` dan seluruh endpoint berawalan `/api`.

| Tujuan | Perintah |
|---|---|
| Install | `pnpm install` |
| Dev (watch) | `pnpm start:dev` |
| Build | `pnpm build` |
| Produksi | `pnpm start:prod` |
| Unit test | `pnpm test` |
| E2E test | `pnpm test:e2e` |
| Coverage | `pnpm test:cov` |
| Lint | `pnpm lint` |
| Format | `pnpm format` |

---

## Variabel Environment

Konfigurasi dimuat dari file `.env` melalui `@nestjs/config` (`ConfigModule.forRoot`, global).

```bash
cp .env.example .env   # lalu isi nilainya
```

File `.env` **tidak** di-commit (ada di `.gitignore`); `.env.example` berisi placeholder sebagai
acuan. **Tidak ada secret yang di-hardcode** — bila `JWT_SECRET` kosong, aplikasi gagal start
(fail-fast).

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `PORT` | Tidak | `3001` | Port HTTP server. |
| `JWT_SECRET` | **Ya** | — (fail-fast) | Secret penandatangan/verifikasi JWT. |
| `JWT_EXPIRES_IN` | Tidak | `1d` | Masa berlaku access token. |

Contoh `.env`:

```bash
PORT=3001
JWT_SECRET=rahasia-produksi
JWT_EXPIRES_IN=1d
```

---

## API Overview

Semua endpoint dilindungi **JWT** (header `Authorization: Bearer <token>`), kecuali login.
Prefix global: `/api`.

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/auth/login` | Publik | Login, menerbitkan access token |
| GET | `/api/pilot/me` | JWT | Profil pilot + total jam terbang |
| GET | `/api/flight-hours` | JWT | Deret jam terbang harian (`from`, `to`) |
| GET | `/api/flight-hours/summary` | JWT | Ringkasan cards + chart (`range`) |
| GET | `/api/documents` | JWT | Daftar dokumen + badge urgensi |
| GET | `/api/schedules` | JWT | Legend + jadwal bulanan (`year`, `month`) |

Kredensial login (hardcoded, assessment): username `johndoe`, password `passjhondoe`.

Contoh:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"johndoe","password":"passjhondoe"}'
```

Detail kontrak (shape request/response, error, edge case) ada di `docs/PRD.md` §4.

---

## Keputusan Teknis & Alasan

| Keputusan | Alasan |
|---|---|
| **In-memory, tanpa database** | Assessment; data cukup dari file JSON, tanpa infra. |
| **Anchor date global `2026-05-15`** | Menjamin kalkulasi "hari ini" konsisten di seluruh modul. `new Date()` tanpa argumen dilarang. |
| **`today: "2026-05-31"` di `mock-documents.json` diabaikan** | Override ke anchor date dilakukan di runtime agar konsisten dengan jadwal & logbook. |
| **`mocks/**` read-only** | Sumber data immutable; normalisasi dilakukan di kode, bukan dengan menyunting JSON. |
| **Import relatif bersuffix `.js`** | Wajib untuk TypeScript ESM (`module: nodenext`). |
| **Vitest, bukan Jest** | Konfigurasi test runner repo ini. |
| **JWT secret dari env (fallback dev)** | Fleksibel & aman untuk produksi; fallback memudahkan development. |
| **Chart `/flight-hours/summary` 15 titik harian** | Mengikuti aturan rolling sum pada `docs/BRIEF.md` §4.3 (`TODAY-7` s.d. `TODAY+7`). |
| **`isCompleted = count_logbooks === count_schedules`** | Sesuai field guide mock; `status` dikembalikan apa adanya. |
| **Data flight-hours `> 2026-05-15` dihitung `0.0`** | Representasi masa depan; file mock menyimpan data hingga `2026-05-31`. |

---

## Struktur Direktori

```text
src/
├── common/            # constants, filters, guards, utils
├── mock-data/         # MockDataService (baca 3 JSON dari mocks/)
├── modules/           # auth, pilot, flight-hours, documents, schedules
├── app.module.ts
└── main.ts
mocks/                 # sumber data JSON (READ-ONLY)
test/                  # e2e (Vitest)
docs/                  # BRIEF.md, PRD.md
```

Peta lengkap dan aturan kerja: lihat `AGENTS.md`.

---

## Fitur Versi Berikutnya (Roadmap)

- **Refresh token & logout** — siklus hidup token yang lengkap.
- **Range chart dinamis** — memakai `displayRangeDays` dari mock untuk jumlah titik yang dapat dikonfigurasi.
- **Caching** — cache response `/flight-hours/summary` bila beban meningkat.
- **Rate limiting** — proteksi endpoint publik/login.
- **RBAC / multi-user** — saat ini hanya pilot tunggal hardcoded.
- **Pagination** — untuk endpoint yang mengembalikan daftar besar.
- **i18n** — pesan error multi-bahasa.
- **Observability** — tracing, metrics, structured logging.
- **Database nyata** — menggantikan sumber in-memory bila data dinamis.

---

## Dokumentasi Terkait

| Dokumen | Isi |
|---|---|
| `docs/BRIEF.md` | Spesifikasi teknis asli (domain, aturan, endpoint). |
| `docs/PRD.md` | Kontrak API, acceptance criteria, decision log. |
| `AGENTS.md` | Kebijakan repo, aturan kode, alur kerja. |

---

## Catatan Pemeliharaan

> README ini **wajib diperbarui** setiap kali ada fitur/endpoint yang dibuat, diubah, atau dihapus,
> agar selalu konsisten dengan kondisi repo. Dokumentasi usang dianggap bug.
> Lihat `AGENTS.md` §N untuk pemetaan dokumen yang perlu diperbarui.

### Change Log

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-10-11 | Ditulis ulang dari boilerplate NestJS: setup & running, variabel environment, keputusan teknis, roadmap, catatan pemeliharaan. |
| 1.1 | 2026-10-11 | Env dimuat via `@nestjs/config` dari `.env`/`.env.example`; `JWT_SECRET` tidak di-hardcode (fail-fast). |
| 1.2 | 2026-10-11 | Implementasi API: auth (login JWT), pilot, flight-hours (list + summary rolling sum), documents (badge urgensi), schedules (filter bulan) — semua terproteksi JWT respons dibungkus interceptor. |
