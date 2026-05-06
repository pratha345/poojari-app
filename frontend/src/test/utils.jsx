// src/test/utils.jsx — Shared render helper with all providers
import { render } from '@testing-library/react';
import { MemoryRouter }   from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider }  from '../context/ThemeContext';

/**
 * Renders a component with all required providers:
 *   HelmetProvider → ThemeProvider → MemoryRouter → ui
 *
 * ThemeProvider polls /api/theme; MSW intercepts that in tests.
 * Without ThemeProvider here, any component that renders <Header>
 * (which renders <FestivalBanner> which calls useTheme) would throw.
 */
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <HelmetProvider>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>
          {ui}
        </MemoryRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react';
export { renderWithProviders as render };
