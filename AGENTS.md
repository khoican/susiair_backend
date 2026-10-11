# AGENTS.md — Panduan & Aturan Repo

> Dokumen ini adalah **single entry point** untuk setiap developer atau AI agent yang bekerja
> di repo ini. Baca ini **sebelum menulis, mengubah, atau menghapus apa pun**.
> Bahasa: Indonesia. Jika ada konflik antar dokumen, urutan otoritas:
> `docs/BRIEF.md` (spesifikasi) → `docs/PRD.md` (kontrak) → `AGENTS.md` (kebijakan) → sisanya.

---

## A. Tentang Repo

Backend REST API berbasis **NestJS 12** untuk **Susi Air Pilot App**, dikonsumsi frontend **Nuxt 3**.
Backend **tidak menggunakan database** — seluruh data dibaca dari file JSON di `mocks/` saat bootstrap
(in-memory). Ini adalah proyek assessment.

- **Konsumen:** frontend Nuxt 3.
- **Pemilik data:** file `mocks/*.json` (read-only, lihat §L).
- **Status saat ini:** starter NestJS → sedang diimplementasikan sesuai `docs/PRD.md`.

---

## B. Peta Dokumen

| Dokumen | Isi | Kapan dibaca |
|---|---|---|
| `docs/BRIEF.md` | Spesifikasi teknis asli (domain, aturan, endpoint) | Sebelum memahami domain/endpoint |
| `docs/PRD.md` | Kontrak API, acceptance criteria, decision log | Acuan implementasi harian |
| `AGENTS.md` | Kebijakan repo, aturan kode, alur kerja (dokumen ini) | Sebelum menulis/mengubah/menghapus apa pun |
| `README.md` | Cara pakai repo (masih boilerplate NestJS, perlu ditulis ulang) | Onboarding |
| `.agents/skills/*` | Skill agent: `nestjs-best-practices`, `prd-generator` | Saat menulis NestJS / menyusun PRD |

---

## C. Stack & Environment

| Item | Nilai |
|---|---|
| Framework | NestJS 12 |
| Bahasa | TypeScript **ESM** (`"type": "module"`, `module: nodenext`) |
| Runtime | Node.js 24, pnpm 11 |
| Test runner | Vitest (`globals: true`) |
| Lint | oxlint (type-aware) |
| Formatter | Prettier |
| Dependency terpasang | `@nestjs/jwt`, `@nestjs/common/core`, `dayjs`, `class-validator`, `class-transformer`, `reflect-metadata`, `rxjs` |

**Kebijakan dependency:** **DILARANG menambah dependency baru** tanpa izin eksplisit.
Gunakan yang sudah terpasang. Jika terpaksa, jelaskan alasannya lebih dulu.

---

## D. Peta Struktur Direktori

```text
src/
├── common/
│   ├── constants/     # anchor date, default pilot, konstanta JWT
│   ├── filters/       # HttpExceptionFilter (respon error seragam)
│   ├── guards/        # JwtAuthGuard
│   └── utils/         # util tanggal (wrapper dayjs)
├── mock-data/         # MockDataService: baca 3 JSON dari mocks/ saat bootstrap
├── modules/
│   ├── auth/          # POST /api/auth/login
│   ├── pilot/         # GET /api/pilot/me
│   ├── flight-hours/  # GET /api/flight-hours, /summary
│   ├── documents/     # GET /api/documents
│   └── schedules/     # GET /api/schedules
├── app.module.ts
└── main.ts
mocks/                 # sumber data JSON (READ-ONLY)
test/                  # e2e (vitest)
docs/                  # BRIEF.md, PRD.md
```

Ikuti struktur ini saat menambah file (lihat `docs/BRIEF.md` §3).

---

## E. Cara Menjalankan

| Tujuan | Perintah |
|---|---|
| Install | `pnpm install` |
| Dev (watch) | `pnpm start:dev` |
| Build | `pnpm build` |
| Produksi | `pnpm start:prod` |
| Unit test | `pnpm test` |
| E2E test | `pnpm test:e2e` |
| Lint | `pnpm lint` |
| Format | `pnpm format` |

---

## F. Domain & Aturan Data (hal non-obvious)

- **Anchor Date global = `2026-05-15`.** Semua kalkulasi "hari ini" memakai konstanta ini
  (`src/common/constants/app.constant.ts`). **Dilarang `new Date()` tanpa argumen.**
- **`mock-documents.json` berisi `today: "2026-05-31"` → DIABAIKAN.** Override ke anchor date
  dilakukan di runtime, bukan dengan menyunting file mock.
- **Data flight-hours `> 2026-05-15` dianggap `0.0`** (file mock berisi data sampai `2026-05-31`).
- **`isCompleted` (schedules)** = `count_logbooks === count_schedules`; field `status` dikembalikan apa adanya.
- **Glossary:**
  - `duty_type` — kategori duty (DTY, RLV, SCK, TRD, TRX, ADM, FER, MED, REC, ULV).
  - `status` — 1 = pending/upcoming, 2 = completed/verified.
  - **rolling sum** — total jam pada rentang `[T - (windowDays - 1), T]`.
  - **badge urgency** — `expired` (<=0), `soon` (0..30), `safe` (>30) hari terhadap anchor.

Detail lengkap: `docs/BRIEF.md` & `docs/PRD.md`.

---

## G. Gerbang Keputusan Sebelum Menulis Kode

Jalankan urutan ini; berhenti di langkah pertama yang memenuhi:

1. **Perlu ada sama sekali?** Kebutuhan spekulatif → lewati (YAGNI).
2. **Sudah ada di repo?** Helper/util/tipe/pola yang sudah ada → pakai ulang.
3. **Stdlib bisa?** Gunakan.
4. **Fitur native platform bisa?** Gunakan.
5. **Dependency yang sudah terpasang bisa?** Gunakan.
6. **Bisa satu baris?** Satu baris.
7. **Baru:** kode minimum yang berjalan.

---

## H. Aturan Penulisan Kode

- **ESM murni:** seluruh import relatif **wajib** bersuffix `.js`
  (mis. `import { AppModule } from './app.module.js'`).
- **Dilarang komentar yang tidak perlu** (inline/block). Kode harus self-explanatory.
  Komentar hanya bila menjelaskan **kenapa** (why) yang tak terlihat dari kode.
- **WAJIB JSDoc untuk setiap function/method public atau exported.** Function privat/trivial
  dikecualikan. Format standar, bahasa Indonesia:
  ```ts
  /**
   * Hitung selisih hari antara dua tanggal terhadap anchor date.
   * @param {string} from - Tanggal awal, format `YYYY-MM-DD`.
   * @param {string} to - Tanggal akhir, format `YYYY-MM-DD`.
   * @returns {number} Jumlah hari (`to` dikurangi `from`).
   * @throws {BadRequestException} Bila format tanggal tidak valid.
   */
  ```
  - Baris ringkas deskripsi fungsi (diawali kata kerja).
  - `@param {Tipe} nama - makna` per parameter.
  - `@returns {Tipe} - makna` bila mengembalikan nilai.
  - `@throws {ErrorType} -` bila melempar error.
  - `@example` opsional untuk function publik yang kompleks.
- **Dilarang `new Date()` tanpa argumen.** Gunakan `dayjs` dengan argumen eksplisit / anchor date.
- **Dilarang abstraksi tak diminta:** interface dengan satu implementasi, factory untuk satu produk,
  config untuk nilai yang tak pernah berubah.
- **Non-trivial logic wajib meninggalkan 1 test runnable** (assert-based atau `*.spec.ts`).
  Logic sepele (one-liner) tidak perlu test.
- Ikuti konvensi: Prettier (`singleQuote`, `trailingComma: all`), oxlint.

---

## I. Aturan Penambahan File/Direktori

- Ikuti struktur `docs/BRIEF.md` §3.
- **Dilarang** membuat file spekulatif / scaffolding "untuk nanti".
- Jangan menduplikasi util/tipe yang sudah ada — cari dulu sebelum menulis.
- Nama file deskriptif sesuai konvensi NestJS (`*.service.ts`, `*.controller.ts`, `*.module.ts`, `*.dto.ts`).

---

## J. Aturan Perubahan File

- **Diff minimum.** Jangan refactor di luar scope tugas.
- **Bug fix = root cause, bukan gejala.** Grep semua caller function yang akan diubah sebelum edit;
  perbaiki sekali di fungsi bersama, bukan di tiap caller.
- Jangan menyentuh file yang tidak relevan dengan tugas.
- Pertahankan gaya & pola yang sudah ada di sekitar kode.

---

## K. Aturan Penghapusan

- Hapus hanya kode mati, duplikat, atau yang sudah tergantikan.
- Pastikan **tidak ada referensi tersisa** (grep import/usage) sebelum menghapus.
- Hapus test yang berpasangan dengan kode yang dihapus agar `pnpm test` tetap hijau.

---

## L. File/Direktori Immutable (DILARANG diubah/tambah/hapus)

| Path | Alasan |
|---|---|
| `mocks/**` | Sumber data read-only; normalisasi dilakukan di runtime, bukan dengan menyunting JSON. |
| `docs/BRIEF.md` | Spesifikasi asli; ubah hanya bila diminta eksplisit. |
| `docs/PRD.md` | Kontrak; ubah hanya untuk sinkronisasi fitur (lihat §N). |
| `node_modules/`, `dist/`, `pnpm-lock.yaml` | Artefak terkelola; jangan edit manual. |
| `AGENTS.md` | Ubah hanya bila diminta eksplisit. |

---

## M. Alur Kerja Wajib

**Sebelum** perubahan:
1. Baca file yang relevan dan telusuri alur end-to-end.
2. Cek semua caller function yang akan disentuh.
3. Susun rencana kecil (file + perubahan).

**Setelah** perubahan:
1. Jalankan `pnpm lint` dan `pnpm test` (tambah `pnpm build` bila mengubah konfigurasi/struktur).
2. Perbarui dokumentasi terkait (lihat §N).
3. **Commit/Push hanya bila diminta eksplisit.** Jangan pernah commit sendiri.

---

## N. Pemeliharaan Dokumentasi (WAJIB)

> Setiap **membuat, memperbarui, atau menghapus** fitur/endpoint **WAJIB** meng-update dokumentasi
> terkait agar selalu konsisten dan up-to-date dengan codebase. **Dokumentasi usang dianggap bug.**

| Perubahan | Dokumen yang diperbarui |
|---|---|
| Endpoint/fitur baru / berubah / dihapus | `docs/PRD.md` (kontrak API + acceptance criteria + decision log) |
| Perubahan spesifikasi domain besar | `docs/BRIEF.md` (hanya bila diminta) + `docs/PRD.md` |
| Perubahan aturan/konvensi repo | `AGENTS.md` |
| Fitur user-facing / cara pakai | `README.md` (kini masih boilerplate NestJS → tulis ulang saat implementasi) |
| Setiap perubahan | Change Log di dokumen terkait |

**Checklist setelah perubahan:**
- [ ] Kontrak di `docs/PRD.md` masih sesuai dengan kode?
- [ ] Acceptance criteria masih benar / sudah ditambah untuk fitur baru?
- [ ] Decision log diperbarui bila ada keputusan baru?
- [ ] `README.md` akurat (cara jalan, endpoint, env)?
- [ ] `AGENTS.md` akurat (struktur, aturan, perintah)?
- [ ] Change Log terisi dengan tanggal + ringkasan perubahan?

---

## O. Penegakan (Enforcement)

| Aturan | Mekanisme | Mode |
|---|---|---|
| No floating promise / lint | `pnpm lint` (oxlint type-aware) | otomatis |
| ESM import suffix `.js` | `pnpm build` (`nodenext`) | otomatis |
| Format kode | `pnpm format` (Prettier) | otomatis |
| Non-trivial logic ada test | `pnpm test` (Vitest) + review | otomatis/manual |
| `mocks/**` immutable | test hash mocks (lihat `test/`) | otomatis (setelah test dibuat) |
| Dilarang komentar tak perlu | review | manual |
| JSDoc di function publik | review (+ opsional plugin oxlint jsdoc) | manual |
| Dilarang dependency baru | review diff `package.json` | manual |

---

## P. Catatan Penyimpangan (`ponytail:`)

Simplifikasi yang sengaja memotong corner nyata wajib ditandai komentar `ponytail:` yang menyebut
**ceiling** (batas kemampuan saat ini) dan **jalur upgrade**:

```ts
// ponytail: JWT secret hardcoded untuk dev; ganti ke process.env wajib di produksi.
```

Catatan: penanda `ponytail:` **bukan** "komentar tak perlu" (§H) — ia diwajibkan. Begitu juga JSDoc,
yang merupakan permintaan eksplisit sehingga sah sebagai pengecualian aturan default "no comments".

---

## Q. Change Log

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-10-11 | Dokumen awal: overview repo, peta dokumen, stack, aturan kode (ESM, JSDoc, no komentar tak perlu, no dep baru), aturan file, immutable, alur kerja, pemeliharaan dokumentasi, penegakan. |
