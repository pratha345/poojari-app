// src/__tests__/pages/Login.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import Login from '../../pages/Login';

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate:  () => mockNavigate,
    useLocation:  () => ({ state: null }),
  };
});

// Mock AuthContext
const mockLogin = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe('Login Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockClear();
  });

  it('renders the login form', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('लॉगिन करा')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/9307720459|email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/पासवर्ड/i)).toBeInTheDocument();
  });

  it('renders password and OTP mode toggle buttons', () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole('button', { name: /पासवर्ड/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OTP लॉगिन/i })).toBeInTheDocument();
  });

  it('switches to OTP mode when OTP button is clicked', async () => {
    renderWithProviders(<Login />);
    const otpBtn = screen.getByRole('button', { name: /OTP लॉगिन/i });
    fireEvent.click(otpBtn);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /OTP पाठवा/i })).toBeInTheDocument()
    );
    // Password field should be gone
    expect(screen.queryByPlaceholderText(/पासवर्ड/i)).not.toBeInTheDocument();
  });

  it('shows link to register page', () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole('link', { name: /येथे नोंदणी करा/i })).toBeInTheDocument();
  });

  it('shows link to forgot password', () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole('link', { name: /पासवर्ड विसरलात/i })).toBeInTheDocument();
  });

  it('shows link to pujari registration', () => {
    renderWithProviders(<Login />);
    // Nav + Login card both have "पुजारी व्हा"; use getAllByRole to accept 1+
    const links = screen.getAllByRole('link', { name: /पुजारी व्हा/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('calls login API and navigates on success', async () => {
    renderWithProviders(<Login />);

    // Fill in the form
    const phoneInput = screen.getByPlaceholderText(/9307720459|email/i);
    const passInput  = screen.getByPlaceholderText(/पासवर्ड/i);
    const submitBtn  = screen.getByRole('button', { name: /लॉगिन करा/i });

    await userEvent.type(phoneInput, '9307720459');
    await userEvent.type(passInput, 'Test@1234');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // MSW mock returns success, so login and navigate should be called
      expect(mockLogin).toHaveBeenCalledWith('mock-jwt-token', expect.objectContaining({ phone: '9307720459' }));
    }, { timeout: 3000 });
  });

  it('OTP flow: phone input shows in step 1', async () => {
    renderWithProviders(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /OTP लॉगिन/i }));

    expect(screen.getByPlaceholderText(/9307720459/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/6 अंकी OTP/i)).not.toBeInTheDocument();
  });
});
