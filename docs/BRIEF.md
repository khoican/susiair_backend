# Backend Technical BRIEF: Susi Air Pilot App API

## 1. Document Overview

Dokumen ini mendefinisikan spesifikasi teknis backend NestJS untuk aplikasi _Susi Air Pilot App_. Backend bertindak sebagai penyedia REST API untuk konsumsi frontend Nuxt 3 tanpa dependensi database eksternal.

---

## 2. Core System Rules & Assumptions

1. **In-Memory Data Storage** : Dilarang menggunakan database (PostgreSQL, MySQL, MongoDB, TypeORM, Prisma, dsb.). Seluruh data wajib di-load dari file JSON di folder `mocks/` saat modul di-bootstrapping.
2. **Global Anchor Date (Tanggal Acuan)** :

- Tanggal acuan global aplikasi adalah **`2026-05-15`** (sesuai instruksi brief dan `mock-schedules.json`).

- **Resolusi Inkonsistensi** : Mitos tanggal `"today": "2026-05-31"` pada `mock-documents.json` wajib diabaikan/di-override oleh `2026-05-15` agar kalkulasi selisih hari dokumen konsisten dengan jadwal dan logbook.

- Dilarang keras menggunakan `new Date()` tanpa argumen untuk menentukan tanggal "hari ini" .

3. **Penerbitan & Proteksi JWT Token** :

- Hardcoded credential: Username `johndoe`, Password `susiairtest`.

- Seluruh endpoint wajib dilindungi `AuthGuard` berbasis JWT, kecuali `POST /auth/login`.

---

## 3. Architecture & Project Structure

```text
src/
├── common/
│   ├── constants/
│   │   └── app.constant.ts       # Anchor Date (2026-05-15), Default Pilot Profile
│   ├── filters/
│   │   └── http-exception.filter.ts # Global Exception Filter untuk respon error standar
│   ├── guards/
│   │   └── jwt-auth.guard.ts     # Auth Guard memeriksa Bearer token
│   └── utils/
│       └── date.util.ts          # Dayjs wrapper & helper selisih tanggal
├── mock-data/
│   ├── mock-data.module.ts
│   └── mock-data.service.ts      # Provider in-memory reader untuk 3 file JSON
├── modules/
│   ├── auth/
│   │   ├── dto/
│   │   │   └── login.dto.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── pilot/
│   │   ├── pilot.controller.ts
│   │   ├── pilot.module.ts
│   │   └── pilot.service.ts
│   ├── flight-hours/
│   │   ├── dto/
│   │   │   ├── flight-hours-query.dto.ts
│   │   │   └── summary-query.dto.ts
│   │   ├── flight-hours.controller.ts
│   │   ├── flight-hours.module.ts
│   │   └── flight-hours.service.ts  # Logika rolling sum & limit calculation
│   ├── documents/
│   │   ├── documents.controller.ts
│   │   ├── documents.module.ts
│   │   └── documents.service.ts     # Logika kalkulasi badge urgency (Safe/Soon/Expired)
│   └── schedules/
│       ├── dto/
│       │   └── schedule-query.dto.ts
│       ├── schedules.controller.ts
│       ├── schedules.module.ts
│       └── schedules.service.ts
├── app.module.ts
└── main.ts

```

---

## 4. API Specification & Data Contracts

### 4.1. Auth Module

#### `POST /auth/login`

- **Public Endpoint**
- **Request Body (DTO)**:

```json
{
  "username": "johndoe", // Required, string
  "password": "susiairtest" // Required, string
}
```

- **Success Response (`200 OK`)**:

```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "pilot": {
      "id": "pilot_001",
      "name": "John Doe",
      "username": "johndoe"
    }
  }
}
```

- **Error Response (`401 Unauthorized`)**:

```json
{
  "statusCode": 401,
  "message": "Invalid username or password",
  "error": "Unauthorized"
}
```

---

### 4.2. Pilot Module

#### `GET /pilot/me`

- **Protected Endpoint**
- **Success Response (`200 OK`)**:

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

### 4.3. Flight Hours Module

#### `GET /flight-hours`

- **Protected Endpoint**
- **Query Parameters (DTO)**:
- `from` (string, ISO date format `YYYY-MM-DD`, required)
- `to` (string, ISO date format `YYYY-MM-DD`, required)

- **Success Response (`200 OK`)**:

```json
{
  "statusCode": 200,
  "data": [
    { "date": "2026-05-01", "hours": 3.8 },
    { "date": "2026-05-02", "hours": 0.0 }
  ]
}
```

#### `GET /flight-hours/summary`

- **Protected Endpoint**
- **Query Parameter (DTO)**:
- `range` (enum string: `1w`, `1m`, `3m`, `6m`, `1y`, required, default `1w`)

- **Aturan Algoritma Server-Side Rolling Sum** :

1. **Tentukan Window & Bounds berdasarkan `range**`:

- `1w`: `windowDays = 7`, `limit = 40`, `max = 45`
- `1m`: `windowDays = 30`, `limit = 100`, `max = 125`
- `3m`: `windowDays = 90`, `limit = 300`, `max = 325`
- `6m`: `windowDays = 180`, `limit = 600`, `max = 625`
- `1y`: `windowDays = 365`, `limit = 1050`, `max = 1200`

2. **Rentang Sumbu X (15 Hari)**:

- Tanggal Tengah (Index 7): `TODAY` (`2026-05-15`)

- Tanggal Mulai Grafik: `TODAY - 7 hari` (`2026-05-08`)

- Tanggal Selesai Grafik: `TODAY + 7 hari` (`2026-05-22`)

3. **Perhitungan Rolling Sum per Tanggal Grafik (`T_i`)** :

- Untuk setiap tanggal $T_i$ dalam rentang grafik (`2026-05-08` s.d. `2026-05-22`):
- Hitung total jam terbang pada rentang $[T_i - (\text{windowDays} - 1), T_i]$.
- **Handling tanggal tanpa data/masa depan** : Jika tanggal belum terjadi atau tidak ada record di JSON, kontribusinya adalah `0.0` jam.

4. **Perhitungan Limit Summary Cards** :

- `daily`: Total jam pada tanggal `2026-05-15` (Limit: 8 jam).

- `weekly`: Rolling sum 7 hari hingga `2026-05-15` (Limit: 40 jam).

- `monthly`: Rolling sum 30 hari hingga `2026-05-15` (Limit: 100 jam).

- `annual`: Rolling sum 365 hari hingga `2026-05-15` (Limit: 1050 jam).

- **Success Response (`200 OK`)**:

```json
{
  "statusCode": 200,
  "data": {
    "cards": {
      "daily": { "current": 6.4, "limit": 8 },
      "weekly": { "current": 30.6, "limit": 40 },
      "monthly": { "current": 95.2, "limit": 100 },
      "annual": { "current": 820.5, "limit": 1050 }
    },
    "chart": {
      "range": "1w",
      "limitLine": 40,
      "yMax": 45,
      "series": [
        { "date": "2026-05-08", "sum": 28.5 },
        { "date": "2026-05-15", "sum": 30.6 },
        { "date": "2026-05-22", "sum": 38.2 }
      ]
    }
  }
}
```

---

### 4.4. Documents Module

#### `GET /documents`

- **Protected Endpoint**
- **Aturan Urgensi Dokumen** :
- Hitung selisih: `daysRemaining = dayjs(expiryDate).diff(TODAY_2026_05_15, 'day')`.

- `daysRemaining <= 0` $\rightarrow$ status: `"expired"`, color: `"danger"` (`#E63757`).

- `0 < daysRemaining <= 30` $\rightarrow$ status: `"soon"`, color: `"warning"` (`#F59E0B`).

- `daysRemaining > 30` $\rightarrow$ status: `"safe"`, color: `"success"` (`#1FBF8F`).

- **Success Response (`200 OK`)**:

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "doc_license",
      "label": "Indonesian License Exp. Date",
      "expiryDate": "2026-05-29",
      "daysRemaining": 14,
      "status": "soon",
      "badgeColor": "#F59E0B"
    }
  ]
}
```

---

### 4.5. Schedule Module

#### `GET /schedules`

- **Protected Endpoint**
- **Query Parameters (DTO)**:
- `year` (number/string, `YYYY`, required)

- `month` (number/string, `MM`, required)

- **Filter Logic**:
- Ambil daftar entri dari `mock-schedules.json` di mana `duty_date` berada dalam bulan dan tahun yang diminta.

- **Success Response (`200 OK`)**:

```json
{
  "statusCode": 200,
  "data": {
    "legend": [
      { "code": "DTY", "label": "On Duty", "color": "#10B981" },
      { "code": "SCK", "label": "Sick", "color": "#EF4444" }
    ],
    "schedules": [
      {
        "id": "97027",
        "duty_date": "2026-05-15",
        "status": 1,
        "base_name": "MKW",
        "base_color": "#10B981",
        "duty_type": "DTY",
        "count_schedules": 6,
        "count_logbooks": 6,
        "isCompleted": true
      }
    ]
  }
}
```

---

## 5. Global Setup Requirements

### 5.1. `main.ts` Configuration

AI agent wajib mengkonfigurasi `main.ts` dengan kode eksekusi berikut :

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Nuxt 3 frontend
  app.enableCors();

  // Global Prefix
  app.setGlobalPrefix('api');

  // Validation Pipe configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
```

---

## 6. Edge Case Handling Matrix for AI Agent

| Kasus Khusus / Edge Case                                                               | Tindakan yang Wajib Diambil Agent                                                                | Kategori Keyakinan |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------ |
| Query parameter berupa string angka (e.g. `month="05"`)                                | Wajib dikonversi otomatis ke bentuk standar via `class-transformer`                              |                    |
| Tanggal grafik berada di luar dataset JSON (misal rentang 1y mundur sampai 2025-05-15) | Tetap kalkulasi data yang tersedia, isi tanggal tanpa data dengan `0.0` jam                      |                    |
| User mengakses endpoint tanpa header `Authorization: Bearer <token>`                   | Kembalikan HTTP `401 Unauthorized` seragam melalui `HttpExceptionFilter`                         |                    |
| Permintaan data grafik untuk rentang masa depan                                        | Jam terbang masa depan dihitung `0.0`, tetapi posisi `TODAY` tetap menjadi jangkar tengah grafik |                    |
