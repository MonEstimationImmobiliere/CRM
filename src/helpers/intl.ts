const currencyFormatter = (options?: Intl.NumberFormatOptions): Intl.NumberFormat => new Intl.NumberFormat("fr-Fr", { style: "currency", currency: "EUR", ...options });
const intFormatter = (options?: Intl.NumberFormatOptions): Intl.NumberFormat => new Intl.NumberFormat("fr-Fr", { style: "decimal", maximumFractionDigits: 0, ...options });
const numberFormatter = (options?: Intl.NumberFormatOptions): Intl.NumberFormat => new Intl.NumberFormat("fr-Fr", { style: "decimal", maximumFractionDigits: 2, ...options });
const decimalFormatter = (options?: Intl.NumberFormatOptions): Intl.NumberFormat => new Intl.NumberFormat("fr-Fr", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2, ...options });
const dateFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-Fr", options);
const dateFullFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-Fr", { dateStyle: "full", ...options });
const dateTimeFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-Fr", { dateStyle: "short", timeStyle: "short", ...options });
const dateMonthYearFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-FR", { year: "numeric", month: "long", ...options });
const dateMonthYearNumericFormatter = (options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => new Intl.DateTimeFormat("fr-FR", { year: "numeric", month: "2-digit", ...options });

export const formatCurrency = (number: number | bigint, options?: Intl.NumberFormatOptions | undefined): string => currencyFormatter(options).format(number);
export const formatInt = (number: number | bigint, options?: Intl.NumberFormatOptions | undefined): string => intFormatter(options).format(number);
export const formatDecimal = (number: number | bigint, options?: Intl.NumberFormatOptions | undefined): string => decimalFormatter(options).format(number);
export const formatNumber = (number: number | bigint, options?: Intl.NumberFormatOptions | undefined): string => numberFormatter(options).format(number);
export const formatDate = (date: string | number | Date, options?: Intl.DateTimeFormatOptions | undefined): string => dateFormatter(options).format(new Date(date));
export const formatDateFull = (date: string | number | Date, options?: Intl.DateTimeFormatOptions | undefined): string => dateFullFormatter(options).format(new Date(date));
export const formatDateTime = (date: string | number | Date, options?: Intl.DateTimeFormatOptions | undefined): string => dateTimeFormatter(options).format(new Date(date));
export const formatMonthYear = (date: string | number | Date, options?: Intl.DateTimeFormatOptions | undefined): string => dateMonthYearFormatter(options).format(new Date(date));
export const formatMonthYearNumeric = (date: string | number | Date, options?: Intl.DateTimeFormatOptions | undefined): string => dateMonthYearNumericFormatter(options).format(new Date(date));
