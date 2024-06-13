const currencyFormatter = (options?: Intl.NumberFormatOptions): Intl.NumberFormat => new Intl.NumberFormat("fr-Fr", { style: "currency", currency: "EUR", ...options });
const intFormatter = (options?: Intl.NumberFormatOptions): Intl.NumberFormat => new Intl.NumberFormat("fr-Fr", { style: "decimal", maximumFractionDigits: 0, ...options });
const numberFormatter = (options?: Intl.NumberFormatOptions): Intl.NumberFormat => new Intl.NumberFormat("fr-Fr", { style: "decimal", maximumFractionDigits: 2, ...options });
const decimalFormatter = (options?: Intl.NumberFormatOptions): Intl.NumberFormat => new Intl.NumberFormat("fr-Fr", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2, ...options });
const dateFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-Fr", options);
const dateFullFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-Fr", { dateStyle: "full", ...options });
const dateTimeFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-Fr", { dateStyle: "short", timeStyle: "short", ...options });
const dateMonthYearFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-FR", { year: "numeric", month: "long", ...options });
const dateMonthYearNumericFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-FR", { year: "numeric", month: "2-digit", ...options });

export const formatCurrency = (number, options?): string => currencyFormatter(options).format(number);
export const formatInt = (number, options?): string => intFormatter(options).format(number);
export const formatDecimal = (number, options?): string => decimalFormatter(options).format(number);
export const formatNumber = (number, options?): string => numberFormatter(options).format(number);
export const formatDate = (date, options?): string => dateFormatter(options).format(new Date(date));
export const formatDateFull = (date, options?): string => dateFullFormatter(options).format(new Date(date));
export const formatDateTime = (date, options?): string => dateTimeFormatter(options).format(new Date(date));
export const formatMonthYear = (date, options?): string => dateMonthYearFormatter(options).format(new Date(date));
export const formatMonthYearNumeric = (date, options?): string => dateMonthYearNumericFormatter(options).format(new Date(date));
