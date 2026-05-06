// src/__tests__/error-handling.test.jsx — Frontend Error Handling Tests
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '../test/utils';
import Home     from '../pages/Home';
import Panchang from '../pages/Panchang';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null, isAuthenticated: false, isAdmin: false, isPujari: false,
    login: vi.fn(), logout: vi.fn(),
  }),
}));
vi.mock('../components/SEOHead',               () => ({ default: () => null }));
vi.mock('../components/common/FestivalBanner', () => ({ default: () => null }));

// ── MSW server for error simulation ──────────────────────────────
const BASE = 'http://localhost:5000/api';

const errorHandlers = {
  apiDown: [
    http.get(`${BASE}/poojas`,      () => HttpResponse.error()),
    http.get(`${BASE}/home`,        () => HttpResponse.error()),
    http.get(`${BASE}/panchang`,    () => HttpResponse.error()),
    http.get(`${BASE}/theme`,       () => HttpResponse.json({ success: true, data: { theme: 'saffron-divine' } })),
    http.get(`${BASE}/poojas/categories`, () => HttpResponse.error()),
  ],
  serverError: [
    http.get(`${BASE}/poojas`,      () => HttpResponse.json({ success: false, message: 'सर्व्हर त्रुटी' }, { status: 500 })),
    http.get(`${BASE}/home`,        () => HttpResponse.json({ success: false, message: 'सर्व्हर त्रुटी' }, { status: 500 })),
    http.get(`${BASE}/panchang`,    () => HttpResponse.json({ success: false, message: 'पंचांग लोड करता आला नाही' }, { status: 500 })),
    http.get(`${BASE}/theme`,       () => HttpResponse.json({ success: true, data: { theme: 'saffron-divine' } })),
    http.get(`${BASE}/poojas/categories`, () => HttpResponse.json({ success: false }, { status: 500 })),
  ],
  notFound: [
    http.get(`${BASE}/poojas`,      () => HttpResponse.json({ success: false }, { status: 404 })),
    http.get(`${BASE}/home`,        () => HttpResponse.json({ success: false }, { status: 404 })),
    http.get(`${BASE}/panchang`,    () => HttpResponse.json({ success: false }, { status: 404 })),
    http.get(`${BASE}/theme`,       () => HttpResponse.json({ success: true, data: { theme: 'saffron-divine' } })),
  ],
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ═══════════════════════════════════════════════════════════════════
// PART 8A: API Down — App Does Not Crash
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: API Unavailable (Network Error)', () => {
  beforeAll(() => server.use(...errorHandlers.apiDown));

  it('Home page renders without crashing when API is down', async () => {
    expect(() => renderWithProviders(<Home />)).not.toThrow();
  });

  it('Home page does not show unhandled error UI when API is down', async () => {
    renderWithProviders(<Home />);
    await waitFor(() => {
      // App should show graceful empty state, not a blank crash or "undefined"
      expect(document.body.innerHTML).not.toContain('undefined');
    }, { timeout: 2000 });
  });

  it('Panchang page renders without crashing when API is down', async () => {
    expect(() => renderWithProviders(<Panchang />, { route: '/panchang' })).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8B: Server Returns 500
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: Server Returns 500', () => {
  beforeAll(() => server.use(...errorHandlers.serverError));

  it('Home page does not crash on 500 response', async () => {
    expect(() => renderWithProviders(<Home />)).not.toThrow();
  });

  it('Home page body is not empty on 500', async () => {
    renderWithProviders(<Home />);
    await waitFor(() => {
      expect(document.body.innerHTML.length).toBeGreaterThan(50);
    }, { timeout: 2000 });
  });

  it('Panchang page handles 500 without blank screen', async () => {
    renderWithProviders(<Panchang />, { route: '/panchang' });
    await waitFor(() => {
      expect(document.body.innerHTML.length).toBeGreaterThan(50);
    }, { timeout: 2000 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8C: 404 Response
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: Server Returns 404', () => {
  beforeAll(() => server.use(...errorHandlers.notFound));

  it('Home page does not crash on 404 API response', async () => {
    expect(() => renderWithProviders(<Home />)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8D: Loading States
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: Loading States', () => {
  it('Home page shows loading spinner before data arrives', () => {
    // Use delayed mock
    server.use(
      http.get(`${BASE}/poojas`, async () => {
        await new Promise(r => setTimeout(r, 500));
        return HttpResponse.json({ success: true, data: { poojas: [], pagination: {} } });
      }),
      http.get(`${BASE}/home`,  () => HttpResponse.json({ success: true, data: {} })),
      http.get(`${BASE}/theme`, () => HttpResponse.json({ success: true, data: { theme: 'saffron-divine' } })),
    );

    renderWithProviders(<Home />);
    // Spinner should be visible immediately
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('Panchang page does not freeze — renders within 3 seconds', async () => {
    server.use(
      http.get(`${BASE}/panchang`, () =>
        HttpResponse.json({ success: true, data: { date: '2025-01-15', tithi: 'द्वितीया' } })
      ),
      http.get(`${BASE}/theme`, () => HttpResponse.json({ success: true, data: { theme: 'saffron-divine' } })),
    );
    renderWithProviders(<Panchang />, { route: '/panchang' });
    await waitFor(() => {
      expect(document.body.innerHTML.length).toBeGreaterThan(50);
    }, { timeout: 3000 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8E: No Console Errors / Unhandled Rejections
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: No Uncaught Errors', () => {
  it('Home renders without console.error being called for uncaught exceptions', async () => {
    // MSW has normal handlers (from global setup)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<Home />);
    await waitFor(() => {
      // No error for unhandled things like "Cannot read property of undefined"
      const uncaughtErrors = consoleSpy.mock.calls.filter(([msg]) =>
        typeof msg === 'string' && (
          msg.includes('Cannot read') ||
          msg.includes('TypeError') ||
          msg.includes('is not a function')
        )
      );
      expect(uncaughtErrors).toHaveLength(0);
    }, { timeout: 2000 });

    consoleSpy.mockRestore();
  });
});
