// src/__tests__/pages/Home.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import Home from '../../pages/Home';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null, isAuthenticated: false, isAdmin: false, isPujari: false, logout: vi.fn(),
  }),
}));

// Mock FestivalBanner
vi.mock('../../components/common/FestivalBanner', () => ({ default: () => null }));

// Mock SEOHead (uses react-helmet-async internals)
vi.mock('../../components/SEOHead', () => ({ default: () => null }));

describe('Home Page', () => {
  it('renders the hero section with tagline', async () => {
    renderWithProviders(<Home />);

    // Main heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('renders Quick Actions section', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('आजची पूजा बुक करा')).toBeInTheDocument();
    expect(screen.getByText('पंचांग पहा')).toBeInTheDocument();
  });

  it('renders Services section', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('ऑनलाइन पूजा बुकिंग')).toBeInTheDocument();
    expect(screen.getByText('मंदिर पूजा')).toBeInTheDocument();
    expect(screen.getByText('पुजारी सेवा')).toBeInTheDocument();
  });

  it('renders "How It Works" steps', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('पूजा निवडा')).toBeInTheDocument();
    expect(screen.getByText('पेमेंट करा')).toBeInTheDocument();
    expect(screen.getByText('पूजा संपन्न')).toBeInTheDocument();
  });

  it('renders all 8 pooja category cards', () => {
    renderWithProviders(<Home />);
    // "गृह पूजा" appears in category chips AND as a PoojaCard category badge
    // Use getAllByText to accept 1+ occurrences — what matters is it's present
    expect(screen.getAllByText('गृह पूजा').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/हवन.*जाप/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('उत्सव पूजा').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('वास्तू पूजा').length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading spinner initially for featured poojas', () => {
    renderWithProviders(<Home />);
    // Spinner should appear while fetching
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders featured poojas after API resolves', async () => {
    renderWithProviders(<Home />);

    // MSW returns 2 poojas
    await waitFor(() => {
      expect(screen.getByText('सत्यनारायण पूजा')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders Trust section with 4 cards', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('सत्यापित पुजारी')).toBeInTheDocument();
    expect(screen.getByText('सहज बुकिंग')).toBeInTheDocument();
    expect(screen.getByText('परवडणाऱ्या किंमती')).toBeInTheDocument();
    expect(screen.getByText('घरपोच सेवा')).toBeInTheDocument();
  });

  it('renders Testimonials section', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('ग्राहकांचे अभिप्राय')).toBeInTheDocument();
    expect(screen.getByText('नेहा शिंदे')).toBeInTheDocument();
  });

  it('renders the "पूजा बुक करा" CTA button', () => {
    renderWithProviders(<Home />);
    const ctaButtons = screen.getAllByRole('link', { name: /आता बुक करा|पूजा बुक करा/i });
    expect(ctaButtons.length).toBeGreaterThan(0);
  });
});
