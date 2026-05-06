// src/__tests__/components/PoojaCard.test.jsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import PoojaCard from '../../components/common/PoojaCard';

const BASE_POOJA = {
  id:            1,
  name_mr:       'सत्यनारायण पूजा',
  slug:          'satyanarayan-pooja',
  short_desc:    'घरामध्ये सुख-समृद्धी आणि ईश्वरी आशीर्वादासाठी पूजा.',
  price:         3963,
  duration_hrs:  3,
  image_url:     null,
  category_name: 'गृह पूजा',
  is_featured:   false,
};

describe('PoojaCard', () => {
  it('renders pooja name', () => {
    renderWithProviders(<PoojaCard pooja={BASE_POOJA} />);
    expect(screen.getByText('सत्यनारायण पूजा')).toBeInTheDocument();
  });

  it('renders price correctly', () => {
    renderWithProviders(<PoojaCard pooja={BASE_POOJA} />);
    // Price should contain ₹ symbol
    expect(screen.getByText(/₹/)).toBeInTheDocument();
  });

  it('renders category badge', () => {
    renderWithProviders(<PoojaCard pooja={BASE_POOJA} />);
    expect(screen.getByText('गृह पूजा')).toBeInTheDocument();
  });

  it('renders duration info', () => {
    renderWithProviders(<PoojaCard pooja={BASE_POOJA} />);
    expect(screen.getByText(/3 तास/)).toBeInTheDocument();
  });

  it('shows "बुक करा" button linking to booking page', () => {
    renderWithProviders(<PoojaCard pooja={BASE_POOJA} />);
    const bookBtn = screen.getByRole('link', { name: /बुक करा/i });
    expect(bookBtn).toBeInTheDocument();
    expect(bookBtn).toHaveAttribute('href', '/booking/satyanarayan-pooja');
  });

  it('does NOT show लोकप्रिय badge when is_featured is false', () => {
    renderWithProviders(<PoojaCard pooja={{ ...BASE_POOJA, is_featured: false }} />);
    expect(screen.queryByText(/लोकप्रिय/)).not.toBeInTheDocument();
  });

  it('shows ⭐ लोकप्रिय badge when is_featured is true', () => {
    renderWithProviders(<PoojaCard pooja={{ ...BASE_POOJA, is_featured: true }} />);
    expect(screen.getByText(/लोकप्रिय/)).toBeInTheDocument();
  });

  it('renders image with lazy loading', () => {
    renderWithProviders(<PoojaCard pooja={BASE_POOJA} />);
    const img = screen.getByRole('img', { name: BASE_POOJA.name_mr });
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('links name and image to detail page', () => {
    renderWithProviders(<PoojaCard pooja={BASE_POOJA} />);
    const links = screen.getAllByRole('link', { name: /सत्यनारायण पूजा/i });
    links.forEach(link => {
      expect(link).toHaveAttribute('href', '/vidhi/satyanarayan-pooja');
    });
  });

  it('shows zero-duration poojas without crashing', () => {
    renderWithProviders(<PoojaCard pooja={{ ...BASE_POOJA, duration_hrs: 0 }} />);
    expect(screen.getByText('सत्यनारायण पूजा')).toBeInTheDocument();
    // Duration should not render for 0 hours
    expect(screen.queryByText(/0 तास/)).not.toBeInTheDocument();
  });
});
