import { createHash } from 'node:crypto';
import fs from 'node:fs';

const MOCK_FILES = [
  {
    path: 'mocks/mock-flight-hours.json',
    sha256: '9AGS8vlrhqreNwsmtXD4ap7hfAqk4Rs5NeMAGpmFS14=',
  },
  {
    path: 'mocks/mock-schedules.json',
    sha256: 'FxpfkqyTmO8Qdic64SZMoRSD19zAf0I0E/ICjCXPeiw=',
  },
  {
    path: 'mocks/mock-documents.json',
    sha256: '+KZ10Ry/vyovRs0H/Ur+fNhiFJ7VSq/fs7qMVt3z7iA=',
  },
] as const;

/**
 * Pin hash kriptografis file mock agar `mocks/**` terbukti immutable.
 * Bila hash berubah, berarti file mock diedit → test gagal.
 */
describe('mocks immutability', () => {
  it.each(MOCK_FILES)('hash $path tidak berubah', ({ path, sha256 }) => {
    const url = new URL(`../${path}`, import.meta.url);
    const content = fs.readFileSync(url);
    const actual = createHash('sha256').update(content).digest('base64');

    expect(actual).toBe(sha256);
  });
});