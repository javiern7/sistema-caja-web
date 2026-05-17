export const AUTH_STORAGE_KEY = 'sistema-caja.auth.v3';
export const OPERATIONAL_STORAGE_KEY = 'sistema-caja.operational.v3';

const LEGACY_STORAGE_KEYS = [
  'sistema-caja.auth',
  'sistema-caja.operational',
  'sistema-caja.auth.v2',
  'sistema-caja.operational.v2',
];

export function cleanupLegacyStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of LEGACY_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}
