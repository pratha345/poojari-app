// src/__tests__/state-management.test.jsx — State Persistence & Context Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

// ── LocalStorage mock helpers ─────────────────────────────────────
const mockStorage = (() => {
  let store = {};
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear:      () => { store = {}; },
  };
})();

// ── Render helpers ────────────────────────────────────────────────
function renderWithAuth(ui, { initialEntries = ['/'] } = {}) {
  return render(
    <HelmetProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {ui}
        </MemoryRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

function renderWithTheme(ui) {
  return render(
    <HelmetProvider>
      <ThemeProvider>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}

// ── Test components ───────────────────────────────────────────────
function AuthDisplay() {
  const { user, isAuthenticated, isAdmin, isPujari, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'guest'}</span>
      <span data-testid="user-name">{user?.name || 'none'}</span>
      <span data-testid="user-role">{user?.role || 'none'}</span>
      <span data-testid="is-admin">{String(isAdmin)}</span>
      <span data-testid="is-pujari">{String(isPujari)}</span>
      <button onClick={() => login('mock-token', { id: 1, name: 'Test User', role: 'user', phone: '9307720459' })}>
        Login as User
      </button>
      <button onClick={() => login('mock-token', { id: 99, name: 'Admin', role: 'admin', phone: '9000000001' })}>
        Login as Admin
      </button>
      <button onClick={() => login('mock-token', { id: 50, name: 'Pujari', role: 'pujari', phone: '9000000002' })}>
        Login as Pujari
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function ThemeDisplay() {
  const { theme, setThemeManually } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setThemeManually('dark-mode')}>Set Dark</button>
      <button onClick={() => setThemeManually('saffron-divine')}>Set Saffron</button>
      <button onClick={() => setThemeManually('ganesh-chaturthi')}>Set Festival</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PART 6A: Authentication State
// ═══════════════════════════════════════════════════════════════════
describe('State Management: Authentication Context', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true });
    mockStorage.clear();
  });

  afterEach(() => { mockStorage.clear(); });

  it('starts as guest when localStorage is empty', () => {
    renderWithAuth(<AuthDisplay />);
    expect(screen.getByTestId('auth-status').textContent).toBe('guest');
    expect(screen.getByTestId('user-name').textContent).toBe('none');
  });

  it('login() sets isAuthenticated true and stores user', async () => {
    renderWithAuth(<AuthDisplay />);
    await act(async () => {
      screen.getByText('Login as User').click();
    });
    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-name').textContent).toBe('Test User');
    expect(screen.getByTestId('user-role').textContent).toBe('user');
  });

  it('login() with admin role sets isAdmin=true', async () => {
    renderWithAuth(<AuthDisplay />);
    await act(async () => {
      screen.getByText('Login as Admin').click();
    });
    expect(screen.getByTestId('is-admin').textContent).toBe('true');
    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
  });

  it('login() with pujari role sets isPujari=true', async () => {
    renderWithAuth(<AuthDisplay />);
    await act(async () => {
      screen.getByText('Login as Pujari').click();
    });
    expect(screen.getByTestId('is-pujari').textContent).toBe('true');
    expect(screen.getByTestId('is-admin').textContent).toBe('false');
  });

  it('logout() resets to guest state and clears storage', async () => {
    renderWithAuth(<AuthDisplay />);

    await act(async () => { screen.getByText('Login as User').click(); });
    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');

    await act(async () => { screen.getByText('Logout').click(); });
    expect(screen.getByTestId('auth-status').textContent).toBe('guest');
    expect(screen.getByTestId('user-name').textContent).toBe('none');
  });

  it('login() stores token in localStorage', async () => {
    renderWithAuth(<AuthDisplay />);
    await act(async () => { screen.getByText('Login as User').click(); });
    expect(mockStorage.getItem('pojjari_token')).toBe('mock-token');
  });

  it('logout() removes token from localStorage', async () => {
    renderWithAuth(<AuthDisplay />);
    await act(async () => { screen.getByText('Login as User').click(); });
    await act(async () => { screen.getByText('Logout').click(); });
    expect(mockStorage.getItem('pojjari_token')).toBeNull();
    expect(mockStorage.getItem('pojjari_user')).toBeNull();
  });

  it('persists login state from localStorage on re-render', () => {
    const userData = { id: 1, name: 'Persisted User', role: 'user', phone: '9307720459' };
    mockStorage.setItem('pojjari_user', JSON.stringify(userData));

    renderWithAuth(<AuthDisplay />);
    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-name').textContent).toBe('Persisted User');
  });

  it('handles corrupted localStorage gracefully (does not crash)', () => {
    mockStorage.setItem('pojjari_user', 'CORRUPTED_JSON{{{{');
    expect(() => renderWithAuth(<AuthDisplay />)).not.toThrow();
    expect(screen.getByTestId('auth-status').textContent).toBe('guest');
  });

  it('admin role also has isAdmin=true (super_admin)', async () => {
    const superAdmin = { id: 1, name: 'SA', role: 'super_admin' };
    mockStorage.setItem('pojjari_user', JSON.stringify(superAdmin));
    renderWithAuth(<AuthDisplay />);
    expect(screen.getByTestId('is-admin').textContent).toBe('true');
  });
});

// ── Theme helper: wait for the initial /api/theme fetch to settle ──
// ThemeProvider fetches on mount; MSW returns { theme: 'default' }.
// We must wait for that fetch to complete before testing manual overrides,
// otherwise the fetch resolves AFTER the click and overwrites our value.
async function waitForThemeSettled() {
  await waitFor(() => {
    const t = screen.getByTestId('current-theme').textContent;
    expect(['saffron-divine', 'default']).toContain(t);
  }, { timeout: 2000 });
}

// ═══════════════════════════════════════════════════════════════════
// PART 6B: Theme State Management
// ═══════════════════════════════════════════════════════════════════
describe('State Management: Theme Context', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true });
    mockStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    mockStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('starts with saffron-divine or default after API fetch', async () => {
    renderWithTheme(<ThemeDisplay />);
    await waitForThemeSettled();
    const theme = screen.getByTestId('current-theme').textContent;
    expect(['saffron-divine', 'default']).toContain(theme);
  });

  it('setThemeManually() overrides theme after initial fetch settles', async () => {
    renderWithTheme(<ThemeDisplay />);
    // Wait for the initial /api/theme fetch to complete first
    await waitForThemeSettled();
    // Now the fetch is done — manual override will not be raced
    await act(async () => { screen.getByText('Set Dark').click(); });
    expect(screen.getByTestId('current-theme').textContent).toBe('dark-mode');
  });

  it('setThemeManually() applies data-theme attribute to document', async () => {
    renderWithTheme(<ThemeDisplay />);
    await waitForThemeSettled();
    await act(async () => { screen.getByText('Set Festival').click(); });
    expect(document.documentElement.getAttribute('data-theme')).toBe('ganesh-chaturthi');
  });

  it('theme can be switched multiple times after fetch settles', async () => {
    renderWithTheme(<ThemeDisplay />);
    await waitForThemeSettled();

    await act(async () => { screen.getByText('Set Dark').click(); });
    expect(screen.getByTestId('current-theme').textContent).toBe('dark-mode');

    await act(async () => { screen.getByText('Set Saffron').click(); });
    expect(screen.getByTestId('current-theme').textContent).toBe('saffron-divine');

    await act(async () => { screen.getByText('Set Festival').click(); });
    expect(screen.getByTestId('current-theme').textContent).toBe('ganesh-chaturthi');
  });

  it('ThemeContext throws when used outside ThemeProvider', () => {
    function BrokenComponent() {
      useTheme();
      return null;
    }
    expect(() => render(<BrokenComponent />)).toThrow('useTheme must be used inside ThemeProvider');
  });

  it('loads cached theme from localStorage instantly before API responds', () => {
    mockStorage.setItem('pojjari_theme', JSON.stringify({ theme: 'dark-mode' }));
    renderWithTheme(<ThemeDisplay />);
    // data-theme is applied synchronously from cache in useState initializer
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark-mode');
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 6C: Data Consistency After API Calls
// ═══════════════════════════════════════════════════════════════════
describe('State Management: API State Updates', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true });
    mockStorage.clear();
  });

  it('user state matches localStorage after login', async () => {
    renderWithAuth(<AuthDisplay />);
    await act(async () => { screen.getByText('Login as User').click(); });

    const storedUser = JSON.parse(mockStorage.getItem('pojjari_user'));
    expect(storedUser.name).toBe('Test User');
    expect(storedUser.role).toBe('user');
    expect(screen.getByTestId('user-name').textContent).toBe(storedUser.name);
  });

  it('multiple rapid logins result in correct final state', async () => {
    renderWithAuth(<AuthDisplay />);

    // Rapid successive logins
    await act(async () => {
      screen.getByText('Login as User').click();
      screen.getByText('Login as Admin').click();
    });

    // Final state should be the last login
    expect(screen.getByTestId('user-role').textContent).toBe('admin');
    expect(screen.getByTestId('is-admin').textContent).toBe('true');
  });

  it('login then logout then login restores correct state', async () => {
    renderWithAuth(<AuthDisplay />);

    await act(async () => { screen.getByText('Login as User').click(); });
    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');

    await act(async () => { screen.getByText('Logout').click(); });
    expect(screen.getByTestId('auth-status').textContent).toBe('guest');

    await act(async () => { screen.getByText('Login as Pujari').click(); });
    expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
    expect(screen.getByTestId('user-role').textContent).toBe('pujari');
  });
});
