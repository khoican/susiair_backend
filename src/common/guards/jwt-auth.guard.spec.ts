import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard.js';

interface MockRequest {
  headers: { authorization?: string };
  user?: unknown;
}

function createContext(authorization?: string): {
  context: ExecutionContext;
  request: MockRequest;
} {
  const request: MockRequest = { headers: { authorization } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

function createGuard(verifyAsync: (token: string) => Promise<unknown>) {
  const jwtService = { verifyAsync } as unknown as JwtService;
  return new JwtAuthGuard(jwtService);
}

describe('JwtAuthGuard', () => {
  it('menolak saat header Authorization tidak ada', async () => {
    const { context } = createContext(undefined);
    const guard = createGuard(async () => ({}));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('menolak saat skema bukan Bearer', async () => {
    const { context } = createContext('Basic abc');
    const guard = createGuard(async () => ({}));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('menempelkan payload ke request.user saat token valid', async () => {
    const { context, request } = createContext('Bearer valid-token');
    const payload = { sub: 'pilot_001' };
    const guard = createGuard(async () => payload);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(payload);
  });

  it('menolak saat verifyAsync melempar error', async () => {
    const { context } = createContext('Bearer invalid');
    const guard = createGuard(async () => {
      throw new Error('invalid token');
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
