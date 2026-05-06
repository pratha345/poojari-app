// src/__tests__/edge-cases.test.jsx — Frontend Edge Case & Form Validation Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/utils';
import Login   from '../pages/Login';
import Contact from '../pages/Contact';
import Panchang from '../pages/Panchang';

// ── Shared mocks ──────────────────────────────────────────────────
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null, isAuthenticated: false, isAdmin: false, isPujari: false,
    login: vi.fn(), logout: vi.fn(),
  }),
}));

vi.mock('../components/SEOHead',               () => ({ default: () => null }));
vi.mock('../components/common/FestivalBanner', () => ({ default: () => null }));
vi.mock('../components/layout/Header',         () => ({ default: () => <nav data-testid="header" /> }));
vi.mock('../components/layout/Footer',         () => ({ default: () => <footer data-testid="footer" /> }));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn(), loading: vi.fn() },
  toast:   { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

// ── Helper: get password-mode phone input by name attribute ───────
const getPhoneInput    = () => document.querySelector('input[name="phone"]');
const getPasswordInput = () => document.querySelector('input[name="password"]') ||
                               document.querySelector('input[type="password"]');

// ═══════════════════════════════════════════════════════════════════
// PART 1A: Login Form — Password Mode
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Login Form', () => {
  it('renders login form with phone and password fields', () => {
    renderWithProviders(<Login />, { route: '/login' });
    // The password-mode form renders name="phone" and name="password" inputs
    expect(getPhoneInput()).toBeTruthy();
    expect(getPasswordInput()).toBeTruthy();
  });

  it('shows toast error when submitting with empty phone + password', async () => {
    const toast = await import('react-hot-toast');
    renderWithProviders(<Login />, { route: '/login' });

    // Find the submit button in password mode
    const submitBtn = screen.getByRole('button', { name: /लॉगिन करा/i });
    await userEvent.click(submitBtn);

    expect(toast.default.error).toHaveBeenCalledWith('सर्व माहिती भरा.');
  });

  it('shows toast error when submitting only phone without password', async () => {
    const toast = await import('react-hot-toast');
    renderWithProviders(<Login />, { route: '/login' });

    const phoneInput = getPhoneInput();
    fireEvent.change(phoneInput, { target: { value: '9307720459' } });

    const submitBtn = screen.getByRole('button', { name: /लॉगिन करा/i });
    await userEvent.click(submitBtn);

    expect(toast.default.error).toHaveBeenCalledWith('सर्व माहिती भरा.');
  });

  it('accepts 10-digit phone number input', () => {
    renderWithProviders(<Login />, { route: '/login' });
    const phoneInput = getPhoneInput();
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    expect(phoneInput.value).toBe('9876543210');
  });

  it('does not crash with very long phone number paste', () => {
    renderWithProviders(<Login />, { route: '/login' });
    const phoneInput = getPhoneInput();
    fireEvent.change(phoneInput, { target: { value: '9'.repeat(100) } });
    expect(phoneInput).toBeInTheDocument();
  });

  it('OTP mode toggle button is visible', () => {
    renderWithProviders(<Login />, { route: '/login' });
    expect(screen.getByText(/OTP लॉगिन/i)).toBeInTheDocument();
  });

  it('switching to OTP mode shows tel input', async () => {
    renderWithProviders(<Login />, { route: '/login' });
    await userEvent.click(screen.getByText(/OTP लॉगिन/i));
    const telInput = document.querySelector('input[type="tel"]');
    expect(telInput).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1B: Contact Form Edge Cases
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Contact Form', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    expect(() => renderWithProviders(<Contact />, { route: '/contact' })).not.toThrow();
  });

  it('renders a form element', () => {
    renderWithProviders(<Contact />, { route: '/contact' });
    expect(document.querySelector('form')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1C: Panchang Page Edge Cases
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Panchang Page', () => {
  it('renders without crashing', () => {
    expect(() => renderWithProviders(<Panchang />, { route: '/panchang' })).not.toThrow();
  });

  it('page body has content after mount', async () => {
    renderWithProviders(<Panchang />, { route: '/panchang' });
    await waitFor(() => {
      expect(document.body.textContent.length).toBeGreaterThan(10);
    }, { timeout: 3000 });
  });

  it('panchang data loads from MSW (tithi is present)', async () => {
    renderWithProviders(<Panchang />, { route: '/panchang' });
    await waitFor(() => {
      expect(screen.queryByText(/द्वितीया|भरणी|प्रीति|पंचांग/i)).toBeTruthy();
    }, { timeout: 3000 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1D: Very Long Inputs Do Not Crash
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Very Long Inputs', () => {
  it('phone input handles 500-char string without crashing', () => {
    renderWithProviders(<Login />, { route: '/login' });
    const phoneInput = getPhoneInput();
    fireEvent.change(phoneInput, { target: { value: '9'.repeat(500) } });
    expect(phoneInput).toBeInTheDocument();
  });

  it('password input handles 1000-char string without crashing', () => {
    renderWithProviders(<Login />, { route: '/login' });
    const passwordInput = getPasswordInput();
    fireEvent.change(passwordInput, { target: { value: 'A'.repeat(1000) } });
    expect(passwordInput).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1E: XSS Attempts Do Not Execute
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: XSS Input Sanitization', () => {
  const XSS_PAYLOADS = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '"><script>alert(1)</script>',
  ];

  XSS_PAYLOADS.forEach(payload => {
    it(`phone input: "${payload.slice(0, 25)}…" does not trigger alert`, () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderWithProviders(<Login />, { route: '/login' });

      // React renders values as text — script tags never execute
      fireEvent.change(getPhoneInput(), { target: { value: payload } });

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });
});
