// src/__tests__/pages/Rashifal.test.jsx — every tab renders the gochar engine's output
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import fixture from '../fixtures/rashifal-gochar.json';
import Rashifal from '../../pages/Rashifal';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, isAdmin: false, isPujari: false, logout: vi.fn() }),
}));
vi.mock('../../components/common/FestivalBanner', () => ({ default: () => null }));
vi.mock('../../components/SEOHead', () => ({ default: () => null }));
vi.mock('../../api/index.js', () => ({
  rashifalAPI: { getGochar: vi.fn((id, period) => Promise.resolve({ data: { data: fixture[period] } })) },
}));

// jsdom has no scrollIntoView
Element.prototype.scrollIntoView = () => {};

async function openMesha() {
  renderWithProviders(<Rashifal />);
  fireEvent.click(screen.getAllByRole('button', { name: /मेष/ })[0]);
}

describe('Rashifal (gochar based)', () => {
  it('today: shows chandrashtama, the moon-based prediction and its basis', async () => {
    await openMesha();
    await waitFor(() => expect(screen.getByText(/हे भविष्य कशावर आधारित आहे/)).toBeInTheDocument());
    expect(screen.getAllByText(/चंद्राष्टम/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(fixture.today.general).length).toBeGreaterThan(0);
  });

  it('weekly, monthly and yearly tabs render', async () => {
    await openMesha();
    fireEvent.click(screen.getByRole('button', { name: /या आठवड्यात/ }));
    await waitFor(() => expect(screen.getByText(/या आठवड्याचे भविष्य/)).toBeInTheDocument());
    expect(screen.getAllByText(/\/१०/).length).toBe(7);

    fireEvent.click(screen.getByRole('button', { name: /या महिन्यात/ }));
    await waitFor(() => expect(screen.getByText(new RegExp(`${fixture.month.month} मासिक भविष्य`))).toBeInTheDocument());
    expect(screen.getByText(fixture.month.overview)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /वार्षिक/ }));
    await waitFor(() => expect(screen.getByText(/वार्षिक भविष्य 2026/)).toBeInTheDocument());
    expect(screen.getByText(fixture.year.overview)).toBeInTheDocument();
  });
});
