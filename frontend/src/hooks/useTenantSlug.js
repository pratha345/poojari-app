// src/hooks/useTenantSlug.js
// Reads ?t=slug from URL and stores in sessionStorage
// All API calls that need tenant context use this

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useTenantSlug() {
  const [params] = useSearchParams();

  useEffect(() => {
    const slug = params.get('t');
    if (slug) sessionStorage.setItem('tenant_slug', slug);
  }, [params]);

  return sessionStorage.getItem('tenant_slug') || null;
}

export function getTenantSlug() {
  return sessionStorage.getItem('tenant_slug') || null;
}
