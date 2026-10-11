import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

process.env.JWT_SECRET = 'e2e-secret';

let app: INestApplication<App>;

async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

async function authToken(): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ username: 'johndoe', password: 'passjhondoe' })
    .expect(200);

  return res.body.data.accessToken as string;
}

function withAuth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeEach(async () => {
  app = await createTestApp();
});

afterEach(async () => {
  await app.close();
});

describe('POST /api/auth/login', () => {
  it('mengembalikan token dan pilot saat kredensial benar', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'johndoe', password: 'passjhondoe' })
      .expect(200);

    expect(res.body).toEqual({
      statusCode: 200,
      message: 'Login successful',
      data: {
        accessToken: expect.any(String),
        pilot: { id: 'pilot_001', name: 'John Doe', username: 'johndoe' },
      },
    });
  });

  it('menolak kredensial salah dengan 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'johndoe', password: 'wrong' })
      .expect(401);

    expect(res.body).toEqual({
      statusCode: 401,
      message: 'Invalid username or password',
      error: 'Unauthorized',
    });
  });

  it('menolak field hilang dengan 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'johndoe' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('menolak properti di luar DTO dengan 400 (forbidNonWhitelisted)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'johndoe', password: 'passjhondoe', evil: true })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.message).toContain('property evil should not exist');
  });
});

describe('proteksi JWT', () => {
  it('menolak akses tanpa token dengan 401 seragam', async () => {
    const res = await request(app.getHttpServer()).get('/api/pilot/me').expect(401);

    expect(res.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    });
  });
});

describe('GET /api/pilot/me', () => {
  it('mengembalikan profil pilot', async () => {
    const token = await authToken();
    const res = await request(app.getHttpServer())
      .get('/api/pilot/me')
      .set(withAuth(token))
      .expect(200);

    expect(res.body).toEqual({
      statusCode: 200,
      data: {
        name: 'John Doe',
        totalFlightHours: 1444.5,
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      },
    });
  });
});

describe('GET /api/flight-hours', () => {
  it('mengembalikan satu entri per hari; hari tanpa record 0.0', async () => {
    const token = await authToken();
    const res = await request(app.getHttpServer())
      .get('/api/flight-hours')
      .query({ from: '2026-05-01', to: '2026-05-02' })
      .set(withAuth(token))
      .expect(200);

    expect(res.body).toEqual({
      statusCode: 200,
      data: [
        { date: '2026-05-01', hours: 3.8 },
        { date: '2026-05-02', hours: 0 },
      ],
    });
  });

  it('menolkan data setelah anchor (masa depan)', async () => {
    const token = await authToken();
    const res = await request(app.getHttpServer())
      .get('/api/flight-hours')
      .query({ from: '2026-05-16', to: '2026-05-17' })
      .set(withAuth(token))
      .expect(200);

    expect(res.body.data.every((entry: { hours: number }) => entry.hours === 0)).toBe(true);
  });

  it('menolak from/to hilang atau bukan tanggal dengan 400', async () => {
    const token = await authToken();
    await request(app.getHttpServer())
      .get('/api/flight-hours')
      .set(withAuth(token))
      .expect(400);

    const res = await request(app.getHttpServer())
      .get('/api/flight-hours')
      .query({ from: 'not-a-date', to: '2026-05-02' })
      .set(withAuth(token))
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });
});

describe('GET /api/flight-hours/summary', () => {
  it('mengembalikan cards dan chart default 1w', async () => {
    const token = await authToken();
    const res = await request(app.getHttpServer())
      .get('/api/flight-hours/summary')
      .set(withAuth(token))
      .expect(200);

    expect(res.body.statusCode).toBe(200);
    expect(res.body.data.cards).toEqual({
      daily: { current: 6.4, limit: 8 },
      weekly: { current: 25.2, limit: 40 },
      monthly: { current: 87.2, limit: 100 },
      annual: { current: 1013.8, limit: 1050 },
    });
    expect(res.body.data.chart).toEqual({
      range: '1w',
      limitLine: 40,
      yMax: 45,
      series: expect.arrayContaining([
        { date: '2026-05-08', sum: 15 },
        { date: '2026-05-15', sum: 25.2 },
        { date: '2026-05-22', sum: 0 },
      ]),
    });
    expect(res.body.data.chart.series).toHaveLength(15);
  });

  it('menolak range di luar enum dengan 400', async () => {
    const token = await authToken();
    const res = await request(app.getHttpServer())
      .get('/api/flight-hours/summary')
      .query({ range: '9z' })
      .set(withAuth(token))
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });
});

describe('GET /api/documents', () => {
  it('mengembalikan 5 dokumen dengan badge urgensi', async () => {
    const token = await authToken();
    const res = await request(app.getHttpServer())
      .get('/api/documents')
      .set(withAuth(token))
      .expect(200);

    expect(res.body.data).toHaveLength(5);
    const byId = Object.fromEntries(
      res.body.data.map((doc: { id: string }) => [doc.id, doc]),
    );
    expect(byId.doc_security).toMatchObject({
      daysRemaining: -14,
      status: 'expired',
      badgeColor: '#E63757',
    });
    expect(byId.doc_recurrent).toMatchObject({ status: 'safe' });
  });
});

describe('GET /api/schedules', () => {
  it('mengembalikan 10 legend dan jadwal Mei 2026 dengan isCompleted', async () => {
    const token = await authToken();
    const res = await request(app.getHttpServer())
      .get('/api/schedules')
      .query({ year: '2026', month: '05' })
      .set(withAuth(token))
      .expect(200);

    expect(res.body.data.legend).toHaveLength(10);
    expect(res.body.data.schedules).toHaveLength(21);
    const byId = Object.fromEntries(
      res.body.data.schedules.map((s: { id: string }) => [s.id, s]),
    );
    expect(byId['97017'].isCompleted).toBe(true);
    expect(byId['97028'].isCompleted).toBe(false);
  });

  it('mengembalikan daftar kosong untuk bulan tanpa data', async () => {
    const token = await authToken();
    const res = await request(app.getHttpServer())
      .get('/api/schedules')
      .query({ year: 2026, month: 7 })
      .set(withAuth(token))
      .expect(200);

    expect(res.body.data.schedules).toEqual([]);
  });

  it('menolak year/month hilang dengan 400', async () => {
    const token = await authToken();
    const res = await request(app.getHttpServer())
      .get('/api/schedules')
      .set(withAuth(token))
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });
});

describe('GET / (root)', () => {
  it('menghasilkan 404 (backend murni API)', async () => {
    await request(app.getHttpServer()).get('/').expect(404);
  });
});