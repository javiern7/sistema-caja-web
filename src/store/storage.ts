export const AUTH_STORAGE_KEY = 'sistema-caja.auth.v2';
export const OPERATIONAL_STORAGE_KEY = 'sistema-caja.operational.v2';

const LEGACY_STORAGE_KEYS = ['sistema-caja.auth', 'sistema-caja.operational'];

export function cleanupLegacyStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of LEGACY_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}
