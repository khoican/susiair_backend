# API.md — Susi Air Pilot App (Backend)

Dokumen penggunaan API REST backend. Kontrak resmi (acceptance criteria, decision log, edge case)
ada di `docs/PRD.md`; dokumen ini ringkasan cara pakai + sampel response.

## 1. Pengenalan

- Base URL: `http://localhost:3001` (port bisa diubah via env `PORT`).
- Prefix global: `/api` → semua endpoint dipanggil sebagai `/api/<path>`.
- Dokumentasi interaktif (OpenAPI/Swagger): `http://localhost:3001/api/docs`, spec JSON di `/api/docs-json`.
- Format respons **sukses** dibungkus interceptor:

  ```json
  { "statusCode": 200, "data": { ... } }
  ```

  Khusus login, terdapat bidang tambahan `message`.
- Format respons **error** dihasilkan `HttpExceptionFilter`:

  ```json
  { "statusCode": 401, "message": "...", "error": "Unauthorized" }
  ```

  `message` adalah string (satu error) atau array string (beberapa error validasi).

- Seluruh endpoint **terproteksi JWT** kecuali `POST /api/auth/login`. Kirim token pada header:

  ```
  Authorization: Bearer <accessToken>
  ```

- Kredensial demo: `username` = `johndoe`, `password` = `passjhondoe`.

## 2. Autentikasi

### `POST /api/auth/login`

Body (JSON):

| Field | Tipe | Required | Keterangan |
|---|---|---|---|
| `username` | string | ya | Username pilot. |
| `password` | string | ya | Password pilot. |

**Sukses `200`:**

```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "pilot": { "id": "pilot_001", "name": "John Doe", "username": "johndoe" }
  }
}
```

**Error `401` (kredensial salah):**

```json
{
  "statusCode": 401,
  "message": "Invalid username or password",
  "error": "Unauthorized"
}
```

**Error `400` (field hilang / bukan string):**

```json
{
  "statusCode": 400,
  "message": ["password should not be empty", "password must be a string"],
  "error": "Bad Request"
}
```

Contoh:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"johndoe","password":"passjhondoe"}'
```

Ambil `accessToken` dari respons untuk header `Authorization` pada endpoint berikut.

## 3. Endpoint Terproteksi

Semua endpoint di bagian ini wajib memakai header `Authorization: Bearer <token>`.
Tanpa token atau token tidak valid → **`401`**:

```json
{ "statusCode": 401, "message": "Unauthorized", "error": "Unauthorized" }
```

### `GET /api/pilot/me`

Profil pilot + total jam terbang. Tanpa parameter.

**Sukses `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "name": "John Doe",
    "totalFlightHours": 1444.5,
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
  }
}
```

---

### `GET /api/flight-hours`

Deret jam terbang harian pada rentang tanggal (inklusif satu entri per hari).

Query params:

| Param | Tipe | Required | Keterangan |
|---|---|---|---|
| `from` | string `YYYY-MM-DD` | ya | Tanggal awal (inklusif). |
| `to` | string `YYYY-MM-DD` | ya | Tanggal akhir (inklusif). |

Aturan data:

- Hari tanpa record di JSON → `hours: 0.0`.
- Tanggal `> anchor (2026-05-15)` dianggap masa depan → `hours: 0.0` (lihat `docs/PRD.md` D6).

**Sukses `200`:**

```json
{
  "statusCode": 200,
  "data": [
    { "date": "2026-05-01", "hours": 3.8 },
    { "date": "2026-05-02", "hours": 0 },
    { "date": "2026-05-16", "hours": 0 }
  ]
}
```

**Error `400` (param hilang / bukan tanggal ISO):**

```json
{
  "statusCode": 400,
  "message": ["from must be a valid ISO 8601 date string"],
  "error": "Bad Request"
}
```

Contoh:

```bash
curl "http://localhost:3001/api/flight-hours?from=2026-05-01&to=2026-05-07" \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/flight-hours/summary`

Ringkasan jam terbang: cards batas periode (daily/weekly/monthly/annual) dan grafik rolling sum.

Query params:

| Param | Tipe | Required | Default | Keterangan |
|---|---|---|---|---|
| `range` | enum | tidak | `1w` | Rentang grafik: `1w`, `1m`, `3m`, `6m`, `1y`. |

Parameter grafik per `range` (dari `mock-flight-hours.json`):

| range | windowDays | limitLine | yMax |
|---|---|---|---|
| 1w | 7 | 40 | 45 |
| 1m | 30 | 100 | 125 |
| 3m | 90 | 300 | 325 |
| 6m | 180 | 600 | 625 |
| 1y | 365 | 1050 | 1200 |

Aturan data:

- Grafik berisi **tepat 15 titik** harian, berpusat pada anchor: `series[0]` = `2026-05-08`, `series[7]` = `2026-05-15`, `series[14]` = `2026-05-22`.
- Tiap titik = rolling sum jam pada `[T - (windowDays - 1), T]`; tanggal masa depan / tanpa data berkontribusi `0.0`. Nilai dibulatkan 1 desimal.

**Sukses `200` (range `1w`, default):**

```json
{
  "statusCode": 200,
  "data": {
    "cards": {
      "daily":   { "current": 6.4,    "limit": 8 },
      "weekly":  { "current": 25.2,   "limit": 40 },
      "monthly": { "current": 87.2,   "limit": 100 },
      "annual":  { "current": 1013.8, "limit": 1050 }
    },
    "chart": {
      "range": "1w",
      "limitLine": 40,
      "yMax": 45,
      "series": [
        { "date": "2026-05-08", "sum": 15 },
        { "date": "2026-05-15", "sum": 25.2 },
        { "date": "2026-05-22", "sum": 0 }
      ]
    }
  }
}
```

> `series` di atas dipersingkat; implementasi menghasilkan **15 entri**. Urutan tanggal naik dari
> `2026-05-08` sampai `2026-05-22`.

**Error `400` (range di luar enum):**

```json
{
  "statusCode": 400,
  "message": ["range must be one of the following values: 1w, 1m, 3m, 6m, 1y"],
  "error": "Bad Request"
}
```

Contoh:

```bash
# default 1w
curl "http://localhost:3001/api/flight-hours/summary" -H "Authorization: Bearer <token>"

# eksplisit bulanan
curl "http://localhost:3001/api/flight-hours/summary?range=1m" -H "Authorization: Bearer <token>"
```

---

### `GET /api/documents`

Daftar dokumen pilot + badge urgensi. Tanpa parameter.

Aturan badge (sisa hari terhadap anchor `2026-05-15`):

| daysRemaining | status | badgeColor |
|---|---|---|
| `<= 0` | `expired` | `#E63757` |
| `0 < x <= 30` | `soon` | `#F59E0B` |
| `> 30` | `safe` | `#1FBF8F` |

**Sukses `200`:**

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "doc_recurrent",
      "label": "Next Recurrent Date",
      "expiryDate": "2026-10-14",
      "daysRemaining": 152,
      "status": "safe",
      "badgeColor": "#1FBF8F"
    },
    {
      "id": "doc_license",
      "label": "Indonesian License Exp. Date",
      "expiryDate": "2026-05-29",
      "daysRemaining": 14,
      "status": "soon",
      "badgeColor": "#F59E0B"
    },
    {
      "id": "doc_security",
      "label": "Security Clearance Exp. Date",
      "expiryDate": "2026-05-01",
      "daysRemaining": -14,
      "status": "expired",
      "badgeColor": "#E63757"
    }
  ]
}
```

> Daftar lengkap berisi 5 dokumen.

---

### `GET /api/schedules`

Jadwal duty bulanan beserta legend. Output berisi seluruh entri `duty_date` pada bulan/tahun yang diminta.

Query params:

| Param | Tipe | Required | Keterangan |
|---|---|---|---|
| `year` | int / string `YYYY` | ya | Tahun. |
| `month` | int / string `MM` | ya | Bulan 1-12. |

Aturan data:

- `legend` = 10 kode duty. Kembali apa adanya dari mock.
- `isCompleted = (count_logbooks === count_schedules)`; `status` dikembalikan apa adanya.
- Bulan tanpa data → `schedules: []` (bukan error).

**Sukses `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "legend": [
      { "code": "DTY", "label": "On Duty", "color": "#10B981" },
      { "code": "RLV", "label": "Requested Leave", "color": "#475569" },
      { "code": "SCK", "label": "Sick", "color": "#EF4444" },
      { "code": "TRD", "label": "Travel Day", "color": "#FBA577" },
      { "code": "TRX", "label": "Training", "color": "#F59E0B" },
      { "code": "ADM", "label": "Administration", "color": "#9CA3AF" },
      { "code": "FER", "label": "Ferry", "color": "#7C2D12" },
      { "code": "MED", "label": "Medical", "color": "#7C3AED" },
      { "code": "REC", "label": "Recurrent", "color": "#0EA5E9" },
      { "code": "ULV", "label": "Unpaid Leave", "color": "#111827" }
    ],
    "schedules": [
      {
        "id": "97017",
        "duty_date": "2026-05-01",
        "status": 2,
        "base_name": "PDG",
        "base_color": "#10B981",
        "duty_type": "DTY",
        "count_schedules": 2,
        "count_logbooks": 2,
        "isCompleted": true
      },
      {
        "id": "97028",
        "duty_date": "2026-05-19",
        "status": 1,
        "base_name": "SIQ",
        "base_color": "#10B981",
        "duty_type": "DTY",
        "count_schedules": 2,
        "count_logbooks": 0,
        "isCompleted": false
      }
    ]
  }
}
```

> `schedules` di atas dipersingkat; Mei 2026 berisi 21 entri.

**Error `400` (year/month hilang atau bukan angka):**

```json
{
  "statusCode": 400,
  "message": ["year must be an integer number", "month must be an integer number"],
  "error": "Bad Request"
}
```

Contoh:

```bash
curl "http://localhost:3001/api/schedules?year=2026&month=05" -H "Authorization: Bearer <token>"
```

## 4. Format Error Umum

| Status | Kapan | Body |
|---|---|---|
| `400` | Validasi gagal (body/query hilang, tipe salah, prop ekstra) | `{ statusCode, message: string[] , error: "Bad Request" }` |
| `401` | Tanpa token / token invalid / kredensial login salah | `{ statusCode, message, error: "Unauthorized" }` |
| `404` | Route tidak dikenal (mis. `GET /`) | Plain 404, tanpa body JSON |
| `500` | Error tak tertangani | `{ statusCode: 500, message: "Internal server error", error: "Internal Server Error" }` |

## 5. Aturan Data Global

- **Anchor date `2026-05-15`** — pengganti "hari ini" untuk seluruh kalkulasi (dokumen, rolling sum, jadwal).
  `today` di dalam file mock diabaikan.
- **Zeroing masa depan** — jam terbang dengan tanggal `> 2026-05-15` dihitung `0.0` (data mock hanya sampai `2026-05-31`).
- **Rolling sum** = total jam pada rentang `[T - (windowDays - 1), T]`.
- **Bulat 1 desimal** pada cards, `current`, `hours`, dan `sum` grafik.
- Kredensial demo hardcoded untuk assessment: `johndoe` / `passjhondoe`.

Kontrak lengkap, acceptance criteria, dan riwayat keputusan: `docs/PRD.md`.