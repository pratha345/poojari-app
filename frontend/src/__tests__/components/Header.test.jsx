// src/__tests__/components/Header.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import Header from '../../components/layout/Header';

// Mock AuthContext with unauthenticated state by default
const mockAuthCtx = {
  user:            null,
  isAuthenticated: false,
  isAdmin:         false,
  isPujari:        false,
  logout:          vi.fn(),
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthCtx,
}));

// Mock FestivalBanner — it uses useTheme but is also tested separately
vi.mock('../../components/common/FestivalBanner', () => ({
  default: () => null,
}));

// Helper: find the hamburger (it is CSS-hidden on desktop viewport,
// so we must pass { hidden: true } to include it in the accessible query)
const getHamburger = (label = /मेनू उघडा/i) =>
  screen.getByRole('button', { name: label, hidden: true });

describe('Header — Unauthenticated', () => {
  beforeEach(() => {
    mockAuthCtx.user            = null;
    mockAuthCtx.isAuthenticated = false;
    mockAuthCtx.isAdmin         = false;
    mockAuthCtx.isPujari        = false;
  });

  it('renders the पूजारी logo', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('पूजारी')).toBeInTheDocument();
  });

  it('shows Login and Register links when not authenticated', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('link', { name: /लॉगिन/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /नोंदणी/i })).toBeInTheDocument();
  });

  it('shows main navigation links', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('link', { name: /मुख्यपृष्ठ/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /पंचांग/i })).toBeInTheDocument();
  });

  it('hamburger button is present in DOM (CSS-hidden on desktop)', () => {
    renderWithProviders(<Header />);
    // { hidden: true } finds elements hidden via CSS (display:none)
    const hamburger = getHamburger(/मेनू उघडा/i);
    expect(hamburger).toBeInTheDocument();
    expect(hamburger).toHaveAttribute('aria-label', 'मेनू उघडा');
  });

  it('mobile menu toggles open and closed on hamburger click', async () => {
    renderWithProviders(<Header />);
    const hamburger = getHamburger(/मेनू उघडा/i);

    fireEvent.click(hamburger);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /मेनू बंद करा/i, hidden: true })
      ).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole('button', { name: /मेनू बंद करा/i, hidden: true })
    );
    await waitFor(() =>
      expect(getHamburger(/मेनू उघडा/i)).toBeInTheDocument()
    );
  });

  it('desktop search form is present', () => {
    renderWithProviders(<Header />);
    // Two search inputs exist (desktop + mobile slide-in); both are correct
    const searchInputs = screen.getAllByRole('textbox', { name: /पूजा शोधा/i });
    expect(searchInputs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Header — Authenticated user', () => {
  beforeEach(() => {
    mockAuthCtx.user            = { id: 1, name: 'Test User', role: 'user' };
    mockAuthCtx.isAuthenticated = true;
    mockAuthCtx.isAdmin         = false;
    mockAuthCtx.isPujari        = false;
  });

  it('shows user first name instead of login/register buttons', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^लॉगिन$/i })).not.toBeInTheDocument();
  });

  it('shows बाहेर पडा button in user dropdown', async () => {
    renderWithProviders(<Header />);
    const userBtn = screen.getByText('Test').closest('button');
    expect(userBtn).toBeTruthy();
    fireEvent.click(userBtn);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /बाहेर पडा/i })
      ).toBeInTheDocument()
    );
  });
});

describe('Header — Authenticated admin', () => {
  beforeEach(() => {
    mockAuthCtx.user            = { id: 99, name: 'Admin', role: 'admin' };
    mockAuthCtx.isAuthenticated = true;
    mockAuthCtx.isAdmin         = true;
    mockAuthCtx.isPujari        = false;
  });

  it('shows प्रशासन link in dropdown for admin', async () => {
    renderWithProviders(<Header />);
    const userBtn = screen.getByText('Admin').closest('button');
    fireEvent.click(userBtn);

    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: /प्रशासन/i })
      ).toBeInTheDocument()
    );
  });
});
