const currencyFormatter = (
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat =>
  new Intl.NumberFormat('fr-Fr', {
    style: 'currency',
    currency: 'EUR',
    ...options,
  });
const intFormatter = (options?: Intl.NumberFormatOptions): Intl.NumberFormat =>
  new Intl.NumberFormat('fr-Fr', {
    style: 'decimal',
    maximumFractionDigits: 0,
    ...options,
  });
const numberFormatter = (
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat =>
  new Intl.NumberFormat('fr-Fr', {
    style: 'decimal',
    maximumFractionDigits: 2,
    ...options,
  });
const decimalFormatter = (
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat =>
  new Intl.NumberFormat('fr-Fr', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
const dateFormatter = (
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat => new Intl.DateTimeFormat('fr-Fr', options);
const dateFullFormatter = (
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('fr-Fr', { dateStyle: 'full', ...options });
const dateTimeFormatter = (
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('fr-Fr', {
    dateStyle: 'short',
    timeStyle: 'short',
    ...options,
  });
const dateMonthYearFormatter = (
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    ...options,
  });
const dateMonthYearNumericFormatter = (
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    ...options,
  });

export const formatCurrency = (
  number: number | bigint,
  options?: Intl.NumberFormatOptions | undefined
): string => currencyFormatter(options).format(number);
export const formatInt = (
  number: number | bigint,
  options?: Intl.NumberFormatOptions | undefined
): string => intFormatter(options).format(number);
export const formatDecimal = (
  number: number | bigint,
  options?: Intl.NumberFormatOptions | undefined
): string => decimalFormatter(options).format(number);
export const formatNumber = (
  number: number | bigint,
  options?: Intl.NumberFormatOptions | undefined
): string => numberFormatter(options).format(number);
export const formatDate = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions | undefined
): string => dateFormatter(options).format(new Date(date));
export const formatDateFull = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions | undefined
): string => dateFullFormatter(options).format(new Date(date));
export const formatDateTime = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions | undefined
): string => dateTimeFormatter(options).format(new Date(date));
export const formatMonthYear = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions | undefined
): string => dateMonthYearFormatter(options).format(new Date(date));
export const formatMonthYearNumeric = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions | undefined
): string => dateMonthYearNumericFormatter(options).format(new Date(date));

// ─── Formateurs de prix / surface ───────────────────────────────────

/** Formate un prix en euros (ex: "250 000 €"). Retourne `fallback` si null/0. */
export const formatPrice = (
  value: number | null | undefined,
  fallback = ''
): string => {
  if (!value) return fallback;
  return formatCurrency(Math.round(value), { maximumFractionDigits: 0 });
};

/** Formate une surface en m² (ex: "120 m²"). Retourne '' si null/0. */
export const formatSurface = (value: number | null | undefined): string => {
  if (!value) return '';
  return `${Math.round(value).toLocaleString('fr-FR')} m²`;
};

// ─── Formateurs de contact ──────────────────────────────────────────

/** Formate un email (minuscule) — pour el-input :formatter */
export const emailFormatter = (value: string): string => value.toLowerCase();
/** Parse un email (trim) — pour el-input :parser */
export const emailParser = (value: string): string => value.trim();

/** Formate un téléphone en groupes de 2 — pour el-input :formatter */
export const phoneFormatter = (value: string): string =>
  value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1 ');
/** Parse un téléphone (chiffres, max 10) — pour el-input :parser */
export const phoneParser = (value: string): string =>
  value.replace(/\D/g, '').substring(0, 10);

// ─── Formateurs de date (raccourcis) ────────────────────────────────

/** Formate une date courte DD-MM-YYYY. Retourne '' si null. */
export const formatDateShort = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/** Retourne true si la date est dans le passé (avant aujourd'hui 00:00) */
export const isDatePassed = (dateStr: string | Date | null): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};
