import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';

function createService(signAsync: (payload: unknown) => Promise<string>) {
  const jwtService = { signAsync } as unknown as JwtService;
  return new AuthService(jwtService);
}

describe('AuthService', () => {
  it('mengembalikan access token dan pilot saat kredensial benar', async () => {
    const service = createService(async () => 'signed-token');

    const result = await service.login({
      username: 'johndoe',
      password: 'susiairtest',
    });

    expect(result).toEqual({
      accessToken: 'signed-token',
      pilot: { id: 'pilot_001', name: 'John Doe', username: 'johndoe' },
    });
  });

  it('menolak saat username salah', async () => {
    const service = createService(async () => 'signed-token');

    await expect(
      service.login({ username: 'someone', password: 'susiairtest' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('menolak saat password salah', async () => {
    const service = createService(async () => 'signed-token');

    await expect(
      service.login({ username: 'johndoe', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
