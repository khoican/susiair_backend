# PRD: Susi Air Pilot App API

**Status:** Draft
**Versi:** 1.0
**Bahasa:** Indonesia
**Referensi utama:** [`docs/BRIEF.md`](./BRIEF.md) (spesifikasi teknis asli — dokumen ini melengkapi, bukan menggantikan)
**Author:** Tim Backend
**Last Updated:** 2026-10-11

> Dokumen ini adalah acuan kerja untuk AI agent dalam membangun backend. Isi yang sudah
> didefinisikan di `BRIEF.md` tidak diduplikasi panjang; di sini fokus pada **kontrak API**,
> **acceptance criteria yang testable**, **resolusi ambiguitas**, dan **batasan**.

---

## 1. Ringkasan

Backend REST API (NestJS 12) untuk aplikasi *Susi Air Pilot App*, dikonsumsi frontend Nuxt 3.
Backend menyediakan 6 endpoint yang menyajikan data pilot, jam terbang, dokumen, dan jadwal.
**Tidak ada database eksternal** — seluruh data dibaca dari file JSON di `mocks/` saat bootstrap.

**Quick facts:**

| Item | Nilai |
|------|-------|
| Target user | Pilot (single hardcoded user) |
| Masalah | Frontend butuh API kontrak tetap tanpa infra database |
| Metrik sukses | Semua 6 endpoint mengembalikan shape sesuai kontrak; seluruh acceptance criteria lulus |
| Stack | NestJS 12, TypeScript ESM, Vitest, dayjs, `@nestjs/jwt` |

### Non-Goals

- Tidak ada autentikasi multi-user / role / RBAC.
- Tidak ada persistensi (write) data — semua read-only.
- Tidak ada frontend / rendering.
- Tidak ada integrasi layanan eksternal.

---

## 2. Persona

**Primary — Pilot (hardcoded).**

- Login `johndoe` / `passjhondoe`, profil `{ id: "pilot_001", name: "John Doe" }`.
- Melihat jam terbang, status dokumen (kedaluwarsa), dan jadwal bulanan.
- Tidak ada registrasi, lupa password, atau manajemen akun.

---

## 3. Aturan Global (mengikat)

1. **Anchor Date Global = `2026-05-15`.** Semua kalkulasi "hari ini" memakai konstanta ini dari
   `common/constants/app.constant.ts`.
2. **Dilarang `new Date()` tanpa argumen.** Gunakan `dayjs` dengan argumen eksplisit atau anchor date.
3. **Data in-memory.** Dimuat dari `mocks/*.json` saat modul di-bootstrap. Tidak ada DB (PostgreSQL,
   MySQL, MongoDB, TypeORM, Prisma, dll.).
4. **`mocks/**` bersifat read-only, immutable.** Dilarang mengubah, menambah, atau menghapus file mock.
   Semua normalisasi data (override `today`, zero future hours, dsb.) dilakukan **di kode saat runtime**,
   bukan dengan menyunting JSON. Konsekuensi: `today: "2026-05-31"` pada `mock-documents.json` **diabaikan**
   (override `2026-05-15`) dan `mock-documents.json` **tidak boleh** disunting untuk memperbaikinya.
5. **JWT guard** melindungi seluruh endpoint kecuali `POST /auth/login`.
6. **Global prefix `api`** → seluruh path aktual berawalan `/api` (mis. `POST /api/auth/login`).
7. **Port** = `process.env.PORT ?? 3001`.
8. **CORS** aktif (untuk Nuxt 3).
9. **Response wrapper** sukses: `{ statusCode, message?, data }`. Error lewat `HttpExceptionFilter`.

---

## 4. Endpoint Contract

| # | Method | Path | Auth | Input | Ringkas |
|---|--------|------|------|-------|---------|
| 1 | POST | `/api/auth/login` | Publik | body `{username, password}` | Terbitkan JWT |
| 2 | GET | `/api/pilot/me` | JWT | — | Profil + total jam |
| 3 | GET | `/api/flight-hours` | JWT | `from`, `to` (YYYY-MM-DD) | Deret harian jam terbang |
| 4 | GET | `/api/flight-hours/summary` | JWT | `range` enum (`1w`..`1y`, default `1w`) | Cards + chart rolling sum |
| 5 | GET | `/api/documents` | JWT | — | Daftar dokumen + badge urgensi |
| 6 | GET | `/api/schedules` | JWT | `year`, `month` | Legend + jadwal bulan tsb |

### 4.1 POST /api/auth/login

- Body (DTO `LoginDto`): `username` (string, required), `password` (string, required).
- Sukses `200`:
  ```json
  { "statusCode": 200, "message": "Login successful",
    "data": { "accessToken": "<jwt>", "pilot": { "id": "pilot_001", "name": "John Doe", "username": "johndoe" } } }
  ```
- Gagal kredensial `401`:
  ```json
  { "statusCode": 401, "message": "Invalid username or password", "error": "Unauthorized" }
  ```

### 4.2 GET /api/pilot/me

- Sukses `200`:
  ```json
  { "statusCode": 200,
    "data": { "name": "John Doe", "totalFlightHours": 1444.5,
      "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250" } }
  ```
- `totalFlightHours` = nilai `pilot.totalFlightHours` dari `mock-flight-hours.json`.
- `avatarUrl` = konstanta default profile (`app.constant.ts`).

### 4.3 GET /api/flight-hours

- Query `from` (ISO `YYYY-MM-DD`, required), `to` (ISO, required).
- Sukses `200`: label `data` berisi **satu entri per hari** dalam `[from, to]` (inklusif):
  ```json
  { "statusCode": 200, "data": [ { "date": "2026-05-01", "hours": 3.8 }, { "date": "2026-05-02", "hours": 0.0 } ] }
  ```
- Hari tanpa record di JSON → `hours: 0.0`.

### 4.4 GET /api/flight-hours/summary

- Query `range` (enum: `1w`, `1m`, `3m`, `6m`, `1y`; required; default `1w`).

**Bounds per range** (windowDays / limit / max):

| range | windowDays | limit | max |
|-------|-----------|-------|-----|
| 1w | 7 | 40 | 45 |
| 1m | 30 | 100 | 125 |
| 3m | 90 | 300 | 325 |
| 6m | 180 | 600 | 625 |
| 1y | 365 | 1050 | 1200 |

**Chart (15 titik harian — lihat Decision Log):**

- Titik ke-0 = `TODAY - 7` (`2026-05-08`), titik ke-7 = `TODAY` (`2026-05-15`), titik ke-14 = `TODAY + 7` (`2026-05-22`).
- Nilai tiap titik `T_i` = rolling sum jam pada rentang `[T_i - (windowDays - 1), T_i]`.
- Tanggal masa depan / tanpa data berkontribusi `0.0`. TODAY tetap jangkar tengah grafik.

**Cards (limit tetap):**

- `daily` = total jam pada `TODAY`, limit `8`.
- `weekly` = rolling sum 7 hari hingga `TODAY`, limit `40`.
- `monthly` = rolling sum 30 hari hingga `TODAY`, limit `100`.
- `annual` = rolling sum 365 hari hingga `TODAY`, limit `1050`.

- Sukses `200`:
  ```json
  { "statusCode": 200,
    "data": {
      "cards": {
        "daily": { "current": 6.4, "limit": 8 },
        "weekly": { "current": 30.6, "limit": 40 },
        "monthly": { "current": 95.2, "limit": 100 },
        "annual": { "current": 820.5, "limit": 1050 }
      },
      "chart": {
        "range": "1w", "limitLine": 40, "yMax": 45,
        "series": [ { "date": "2026-05-08", "sum": 28.5 }, { "date": "2026-05-15", "sum": 30.6 }, { "date": "2026-05-22", "sum": 38.2 } ]
      }
    } }
  ```
  > `series` pada contoh di atas dipersingkat; implementasi **wajib** menghasilkan 15 entri (lihat AC-FH-05).

### 4.5 GET /api/documents

- `daysRemaining = dayjs(expiryDate).diff(anchor, 'day')`.
- Urgensi: `<= 0` → `expired` / `#E63757`; `0 < d <= 30` → `soon` / `#F59E0B`; `> 30` → `safe` / `#1FBF8F`.
- Sukses `200`:
  ```json
  { "statusCode": 200,
    "data": [ { "id": "doc_license", "label": "Indonesian License Exp. Date", "expiryDate": "2026-05-29",
      "daysRemaining": 14, "status": "soon", "badgeColor": "#F59E0B" } ] }
  ```
- Ambang 30 hari diambil dari `mock-documents.json` `thresholds.warningDays`.

### 4.6 GET /api/schedules

- Query `year` (number|string `YYYY`, required), `month` (number|string `MM`, required).
- Filter entri `schedules[]` di mana `duty_date` berada pada bulan/tahun tsb.
- Sukses `200`:
  ```json
  { "statusCode": 200,
    "data": {
      "legend": [ { "code": "DTY", "label": "On Duty", "color": "#10B981" } ],
      "schedules": [ { "id": "97027", "duty_date": "2026-05-15", "status": 1, "base_name": "MKW",
        "base_color": "#10B981", "duty_type": "DTY", "count_schedules": 6, "count_logbooks": 6, "isCompleted": true } ] } }
  ```
- `legend` = seluruh entri `legend` dari `mock-schedules.json` (10 kode: DTY, RLV, SCK, TRD, TRX, ADM, FER, MED, REC, ULV).
- `isCompleted` dihitung (tidak ada di sumber) — lihat Decision Log.

---

## 5. User Stories & Acceptance Criteria

### Epic A — Auth

**A1. Login**
```
Sebagai pilot, saya ingin login dengan kredensial, agar mendapat token untuk mengakses API.
```
- [ ] AC-A-01: `POST /api/auth/login` dengan `johndoe`/`passjhondoe` → `200`, `data.accessToken` JWT valid, `data.pilot` sesuai kontrak.
- [ ] AC-A-02: kredensial salah → `401` dengan `message: "Invalid username or password"`.
- [ ] AC-A-03: `username`/`password` kosong atau hilang → `400` (ValidationPipe).
- [ ] AC-A-04: properti body di luar DTO ditolak `400` (`forbidNonWhitelisted`).

### Epic B — Pilot

**B1. Profil**
```
Sebagai pilot, saya ingin melihat profil & total jam, agar tahu akumulasi jam terbang saya.
```
- [ ] AC-B-01: `GET /api/pilot/me` tanpa token → `401`.
- [ ] AC-B-02: dengan token valid → `200`, `data` = `{name, totalFlightHours, avatarUrl}` sesuai kontrak; `totalFlightHours` = `1444.5`.

### Epic C — Flight Hours

**C1. Deret harian**
```
Sebagai pilot, saya ingin melihat jam terbang per hari pada rentang tertentu.
```
- [ ] AC-FH-01: `from`/`to` valid → `200`, satu entri per hari inklusif.
- [ ] AC-FH-02: hari tanpa data → `hours: 0.0`.
- [ ] AC-FH-03: `from`/`to` hilang atau format bukan `YYYY-MM-DD` → `400`.

**C2. Summary rolling sum**
```
Sebagai pilot, saya ingin melihat ringkasan jam (harian/mingguan/bulanan/tahunan) dan grafik tren,
agar bisa memantau batas jam terbang.
```
- [ ] AC-FH-04: `range` di luar enum → `400`; tanpa `range` → default `1w`.
- [ ] AC-FH-05: `chart.series` berisi **tepat 15 entri**, `series[0].date = 2026-05-08`, `series[7].date = 2026-05-15`, `series[14].date = 2026-05-22`.
- [ ] AC-FH-06: nilai `sum` tiap titik = rolling sum sesuai `windowDays` range; tanggal masa depan dihitung `0.0`.
- [ ] AC-FH-07: `chart.limitLine` & `chart.yMax` sesuai bounds range.
- [ ] AC-FH-08: `cards` = `{daily, weekly, monthly, annual}` dengan `current` & `limit` sesuai aturan; `daily.current` = jam pada `2026-05-15`.
- [ ] AC-FH-09: rentang mundur di luar dataset (mis. `1y` hingga `2025-05-15`) → hari tanpa data `0.0`, tidak error.

### Epic D — Documents

**D1. Badge urgensi**
```
Sebagai pilot, saya ingin tahu dokumen mana yang mendekati/lewat kedaluwarsa.
```
- [ ] AC-DOC-01: `daysRemaining` = selisih hari terhadap anchor `2026-05-15` (bukan `today` di mock).
- [ ] AC-DOC-02: klasifikasi status & `badgeColor` sesuai ambang (termasuk batas `<=0` dan `<=30`).
- [ ] AC-DOC-03: `GET /api/documents` tanpa token → `401`.
- [ ] AC-DOC-04: `doc_security` (expiry `2026-05-01`) → `expired`/`#E63757`; `doc_license` (`2026-05-29`) → `soon`/`#F59E0B`.

### Epic E — Schedules

**E1. Jadwal bulanan**
```
Sebagai pilot, saya ingin melihat jadwal duty per bulan beserta legend.
```
- [ ] AC-SCH-01: `year`+`month` valid → hanya entri dengan `duty_date` pada bulan/tahun tsb.
- [ ] AC-SCH-02: `year`/`month` string angka (`"2026"`, `"05"`) dikonversi otomatis (implicit conversion).
- [ ] AC-SCH-03: `year`/`month` hilang/invalid → `400`.
- [ ] AC-SCH-04: `legend` = seluruh 10 entri legend dari mock.
- [ ] AC-SCH-05: `isCompleted = (count_logbooks === count_schedules)`; `status` dikembalikan apa adanya.
- [ ] AC-SCH-06: bulan tanpa data → `schedules: []` (bukan error).

---

## 6. Decision Log (resolusi ambiguitas)

| # | Topik | Keputusan | Alasan |
|---|-------|-----------|--------|
| D1 | Titik chart | **15 titik harian** `TODAY-7`..`TODAY+7`; index 7 = TODAY | Mengikuti aturan §4.3 BRIEF; contoh 3 titik = ilustrasi. |
| D2 | `displayRangeDays` di mock | **Diabaikan**; chart fixed 15 titik | BRIEF tidak mendefinisikan pengaruhnya. `ponytail:` ceiling — bila kelak butuh range dinamis, ganti fixed 15 dengan `2*displayRangeDays+1`. |
| D3 | `isCompleted` | `count_logbooks === count_schedules` | Konsisten dengan field guide & contoh (`status:1` + flag true). |
| D4 | `status` field | Dikembalikan apa adanya dari mock | Tidak ada aturan transformasi. |
| D5 | Override `today` dokumen | `mock-documents.json` `today:"2026-05-31"` diabaikan → anchor `2026-05-15` | BRIEF §2 + aturan immutable mocks. |
| D6 | Filter `mock-flight-hours` | Data `> 2026-05-15` di-nol-kan saat runtime (data ada sampai `2026-05-31`) | Masa depan = `0.0`; file mock tidak disentuh. |
| D7 | JWT | Secret `process.env.JWT_SECRET ?? <konstanta dev>`, expiry `1d` | Tidak dispesifikasikan BRIEF. `ponytail:` konstanta dev — ganti dengan secret env wajib di produksi. |
| D8 | Port | `process.env.PORT ?? 3001` | BRIEF §5; kode starter masih 3000 → disesuaikan. |
| D9 | Prefix | `/api` | BRIEF §5 `setGlobalPrefix('api')`. |
| D10 | `avatarUrl` | Konstanta default profile | Tidak ada di mock; contoh BRIEF dipakai. |

---

## 7. Edge Case Matrix

| Kasus | Tindakan wajib |
|-------|----------------|
| Query string angka (`month="05"`) | Konversi otomatis via class-transformer (`enableImplicitConversion`). |
| Tanggal grafik di luar dataset JSON | Tetap kalkulasi data yang ada; isi tanpa data dengan `0.0`. |
| Tanpa header `Authorization: Bearer <token>` | `401 Unauthorized` seragam via `HttpExceptionFilter`. |
| Range masa depan | Jam masa depan `0.0`; TODAY tetap jangkar tengah grafik. |
| Token invalid/kedaluwarsa | `401` via guard. |
| Body/query non-whitelist | `400` (ValidationPipe `forbidNonWhitelisted`). |
| Bulan tanpa jadwal | `200` dengan `schedules: []`. |
| File mock berubah | Dilarang (constraint §3.4) — dijaga test (lihat §10). |

---

## 8. Kontrak Teknis

- **ESM murni** (`"type": "module"`): seluruh import relatif **wajib** bersuffix `.js`
  (mis. `import { AppModule } from './app.module.js'`).
- **Konfigurasi `main.ts`**: CORS, `setGlobalPrefix('api')`, `ValidationPipe`
  (`whitelist`, `transform`, `enableImplicitConversion`, `forbidNonWhitelisted`),
  global `HttpExceptionFilter`, port `process.env.PORT ?? 3001`.
- **MockDataService**: hanya `fs.readFileSync` + JSON parse saat bootstrap. **Read-only**, tidak ada write.
- **Date util**: pembungkus `dayjs`, operasi selisih hari & iterasi rentang tanggal terhadap anchor date.
- **Dependency**: gunakan yang sudah terpasang (`@nestjs/jwt`, `dayjs`, `class-validator`,
  `class-transformer`, `@nestjs/config`). **Jangan tambah dependency baru.**
- **Test runner**: Vitest (`globals: true`). Lint: `oxlint`. Format: `prettier`.
- **Struktur folder**: ikuti `BRIEF.md` §3 (`src/common`, `src/mock-data`, `src/modules/*`).

---

## 9. Scope

**In Scope (MVP):** 6 endpoint sesuai §4, JWT guard, mock loader read-only, global exception filter,
validation pipe, date util, unit + e2e test, lint bersih.

**Out of Scope:** database/ORM, write/mutasi data, multi-user & RBAC, refresh token / logout,
pagination, i18n, observability/deploy, perubahan pada `mocks/`.

**Future Considerations:** range chart dinamis (`displayRangeDays`), caching response, rate limiting,
secret JWT via env wajib.

---

## 10. Test Plan

Unit (per service/util) + e2e (supertest, sudah terpasang):

1. **Auth**: login sukses/gagal/validasi; endpoint terproteksi tanpa token → `401`.
2. **Flight-hours**: `from`/`to` inklusif + zero-fill; 15 titik chart dengan index 7 = TODAY;
   rolling sum per range; zero-future; cards.
3. **Documents**: klasifikasi batas (`<=0`, `<=30`, `>30`) & override anchor.
4. **Schedules**: filter bulan/tahun; konversi query string; `isCompleted`; bulan kosong; legend lengkap.
5. **Immutable mocks**: hash 3 file `mocks/*.json` sebelum & sesudah bootstrap app harus identik
   (gagal bila ada kode yang menulis/menyunting). `ponytail:` cukup hash + compare, tanpa framework.

Acceptance criteria (§5) menjadi basis test case.

---

## 11. Risiko & Open Questions

| Risiko/Open | Dampak | Mitigasi/Status |
|-------------|--------|-----------------|
| Format `error` pada error non-login tak didefinisikan eksplisit | Inkonsistensi response | `HttpExceptionFilter` menyeragamkan; konfirmasi ke frontend bila perlu. |
| Nilai pasti `avatarUrl`/`pilot.id` hanya contoh | Frontend mungkin beda ekspektasi | Pakai konstanta default (D10); mudah diganti 1 baris. |
| JWT secret dev hardcoded | Tidak aman di produksi | D7: `ponytail:` ganti ke env wajib saat produksi. |
| Contoh `series` di BRIEF hanya 3 titik | Implementor salah kaprah | D1 + AC-FH-05 mengunci 15 titik. |

---

## 12. Change Log

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0 | 2026-10-11 | Draft awal; keputusan D1–D10; aturan mocks immutable. |
