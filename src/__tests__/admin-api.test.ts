/**
 * @jest-environment node
 */
import { PATCH as patchConfig, GET as getConfig } from '@/app/api/admin/config/route';
import { PUT as putPassword } from '@/app/api/admin/password/route';
import type { NextRequest } from 'next/server';

// Mock admin auth – always authorize
jest.mock('@/lib/adminAuth', () => ({
  checkAdminAuth: jest.fn().mockResolvedValue(true),
}));

// Mock config functions – avoid DB side effects
jest.mock('@/lib/config', () => ({
  getWordLimits: jest.fn().mockResolvedValue({
    station1: 120,
    station2: 150,
    station3: 150,
    station4: 200,
    station5: 240,
    station6: 150,
    consequence: 60,
  }),
  setWordLimits: jest.fn().mockResolvedValue(undefined),
  setAdminPassword: jest.fn().mockResolvedValue(undefined),
}));

function mockRequest(body?: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

describe('Admin Config API', () => {
  test('GET returns word limits', async () => {
    const res = await getConfig(mockRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('station1');
  });

  test('PATCH rejects invalid limits', async () => {
    const badBody = { station1: -5, station2: 100, station3: 100, station4: 100, station5: 100, station6: 100, consequence: 20 };
    const res = await patchConfig(mockRequest(badBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  test('PATCH accepts valid limits', async () => {
    const goodBody = { station1: 100, station2: 100, station3: 100, station4: 100, station5: 100, station6: 100, consequence: 20 };
    const res = await patchConfig(mockRequest(goodBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('wordLimits');
  });
});

describe('Admin Password API', () => {
  test('PUT rejects empty password', async () => {
    const res = await putPassword(mockRequest({ password: '' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  test('PUT accepts valid password', async () => {
    const res = await putPassword(mockRequest({ password: 'newSecret' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });
});
