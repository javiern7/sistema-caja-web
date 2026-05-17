export function formatCurrency(value?: number | null) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'No disponible';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatDate(value?: string | null) {
  if (!value) {
    return 'No disponible';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('es-PE');
}
