// src/test/mocks/handlers.js — MSW API route handlers for frontend tests
// Uses absolute URL because VITE_API_URL=http://localhost:5000/api in .env
import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:5000/api';

// ── Mock data ─────────────────────────────────────────────────────
export const MOCK_POOJAS = [
  {
    id: 1, name_mr: 'सत्यनारायण पूजा', slug: 'satyanarayan-pooja',
    price: 3963, duration_hrs: 3, category_name: 'गृह पूजा',
    is_featured: true, short_desc: 'घरामध्ये सुख-समृद्धी साठी.',
    image_url: null,
  },
  {
    id: 2, name_mr: 'गृहप्रवेश पूजा', slug: 'gruhpravesh',
    price: 6372, duration_hrs: 4, category_name: 'वास्तू पूजा',
    is_featured: true, short_desc: 'नवीन घरात प्रवेश साठी.',
    image_url: null,
  },
];

export const MOCK_USER = {
  id: 1, name: 'Test User', phone: '9307720459',
  email: 'test@pojjari.com', role: 'user', tenant_id: 1,
};

export const MOCK_PANCHANG = {
  date:      '2025-01-15',
  tithi:     'द्वितीया',
  nakshatra: 'भरणी',
  yoga:      'प्रीति',
  karana:    'बालव',
  sunrise:   '07:10',
  sunset:    '18:15',
  rahu_kaal: '10:30-12:00',
};

// ── Handlers ──────────────────────────────────────────────────────
export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      success: true,
      message: 'लॉगिन यशस्वी! 🙏',
      data:    { token: 'mock-jwt-token', user: MOCK_USER },
    })
  ),

  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json(
      { success: true, message: 'नोंदणी यशस्वी झाली! 🙏', data: { token: 'mock-jwt-token', user: MOCK_USER } },
      { status: 201 }
    )
  ),

  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({ success: true, data: MOCK_USER })
  ),

  // Poojas
  http.get(`${BASE}/poojas`, () =>
    HttpResponse.json({
      success: true,
      data: { poojas: MOCK_POOJAS, pagination: { total: 2, page: 1, pages: 1 } },
    })
  ),

  http.get(`${BASE}/poojas/categories`, () =>
    HttpResponse.json({
      success: true,
      data: [
        { id: 1, name_mr: 'गृह पूजा',   slug: 'gruh-pooja'  },
        { id: 2, name_mr: 'वास्तू पूजा', slug: 'vastu-pooja' },
      ],
    })
  ),

  http.get(`${BASE}/poojas/:slug`, ({ params }) =>
    HttpResponse.json({ success: true, data: { ...MOCK_POOJAS[0], slug: params.slug } })
  ),

  // Panchang
  http.get(`${BASE}/panchang`, () =>
    HttpResponse.json({ success: true, data: MOCK_PANCHANG })
  ),

  // Theme
  http.get(`${BASE}/theme`, () =>
    HttpResponse.json({ success: true, data: { theme: 'default', festival: null } })
  ),

  // Home content
  http.get(`${BASE}/home`, () =>
    HttpResponse.json({
      success: true,
      data: { content: null, sliders: [] },
    })
  ),

  // Contact
  http.post(`${BASE}/contact`, () =>
    HttpResponse.json({ success: true, message: 'संदेश पाठवला! 🙏' })
  ),
];
