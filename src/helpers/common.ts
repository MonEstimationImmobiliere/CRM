
import type { AxiosResponse } from "axios";

import type { IAddress, Optional } from "../types/common";

export const hasKey = (object: unknown, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key);
export const capitalizeFirstLetter = (word: string): string => word.charAt(0).toLocaleUpperCase() + word.slice(1);
export const capitalize = (words: string): string => words.split(/\S+/g).map((word): string => capitalizeFirstLetter(word)).join(" ");
export const parseYYYYMMDDToDate = (date: string): Date | null => {
  if (!/^\d{8}$/.test(date)) return null;
  const parsedDate = new Date(date.replace(/(\d{4})(\d{2})(\d{2})/g, "$1-$2-$3"));
  if (parsedDate.getTime() < 0) return null;
  return parsedDate;
};

export const dateToYYYYMMDD = (date: Date): string => date.toISOString().split("T")[0]?.replace(/-/g, "") ?? "";
export const dateToYYYYMMDDHHmmSS = (date: Date): string => date.toISOString().split(".")[0]?.replace(/-/g, "").replace("T", "").replaceAll(":", "").replace("Z", "") ?? "";

export const downloadFile = (url: string | Blob | ArrayBuffer, { target = "_blank", fileName = "" } = {}): void => {
  const { href, isBlobURL } = ((): { href: string; isBlobURL: boolean } => {
    if (url instanceof Blob) {
      return {
        href: URL.createObjectURL(url),
        isBlobURL: true
      };
    } else if (url instanceof ArrayBuffer) {
      return {
        href: URL.createObjectURL(new Blob([url])),
        isBlobURL: true
      };
    } else if (typeof url === "string") {
      return {
        href: url,
        isBlobURL: false
      };
    }

    return {
      href: "#",
      isBlobURL: false
    };
  })();

  const link = document.createElement("a");
  link.setAttribute("href", href);
  link.setAttribute("target", target);
  link.setAttribute("download", fileName);
  link.click();

  if (isBlobURL) URL.revokeObjectURL(href);
};

export const sha256 = async (data: ArrayBuffer | string): Promise<string> => {
  const content = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest("SHA-256", content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b): string => b.toString(16).padStart(2, "0")).join("");
};

export const clamp = (number, min, max): number => Math.min(Math.max(number, min), max);

export const randomInt = (min: number, max: number): number => parseInt((Math.random() * (max + 1 - min) + min).toFixed(0));

export const waitFor = async (timeToWaitInMs: number, callback?: () => unknown): Promise<void> => {
  return new Promise<void>((resolve): void => {
    setTimeout((): void => {
      if (callback) callback();
      return resolve();
    }, timeToWaitInMs);
  });
};

export const unique = <T>(array: T[]): T[] => Array.from(new Set(array));

export const extractFileNameFromResponseHeaders = (response: AxiosResponse): string | undefined => {
  const contentDispositionHeader = response.headers["content-disposition"];
  if (!contentDispositionHeader) return;

  const fileNamePart = contentDispositionHeader.split(";").find((part): boolean => part.includes("filename="));
  if (!fileNamePart) return;

  return /filename="?([^"]*)"?/g.exec(fileNamePart)?.[1];
};

export const objectKeysToLowerCamelKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]): [string, unknown] => [k.charAt(0).toUpperCase() + k.slice(1), v])
  );
};

export const isNil = (value: unknown): boolean => value === null || value === undefined;

export const isEmptyString = (value: unknown): boolean => typeof value === "string" && !value.length;

export const isEmpty = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length === 0;
  return isNil(value) || isEmptyString(value);
};

export const checkLuhn = (rawValue): boolean => {
  if (/[^0-9-\s]+/.test(rawValue)) return false;
  const value: string = rawValue.replace(/\D/g, "");

  const checks = value
    .split("")
    .reduce((checks, char, index): number => {
      const digit = parseInt(char, 10);

      if (!((value.length + index) % 2)) {
        const digitByTwo = digit * 2;
        return checks + (digitByTwo > 9 ? digitByTwo - 9 : digitByTwo);
      }

      return checks + digit;
    }, 0);

  return checks % 10 === 0;
};

export const safeStringConcat = (...strings: Array<string | undefined | null>): string => {
  return strings.filter((string): boolean => !!string).join("");
};

export const isObject = (value: unknown): boolean => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

export const cleanNumericString = (string: string): string => {
  return string
    .replace(/[^0-9\-,.]+/g, "")
    .replace(/,+/g, ".")
    .split(/\./g)
    .reduce((numericString, part, index): string => {
      if (index === 1) return numericString.concat(".", part);
      return numericString.concat(part);
    }, "");
};

/**
 * Retry a function until it returns a truthy value or the max retries are reached.
 * @param asyncCallback callback to be called
 * @param settings settings for the retry
 * @returns {Promise<void>} promise that resolves when the callback returns a truthy value
 */
export const retryUntil = async <T extends (retryCount: number) => Promise<boolean>>(asyncCallback: T, settings: { retryInterval: number; maxRetry: number; signal?: AbortSignal }): Promise<void> => {
  return new Promise<void>((resolve, reject): void => {
    let currentTimeout;

    const abort = (): void => {
      clearTimeout(currentTimeout);
      const error = new Error("retryUntil() has been aborted.", { cause: settings.signal?.reason });
      error.name = "AbortError";
      return reject(error);
    };

    if (settings.signal?.aborted) {
      return abort();
    }

    const execute = async (retryLeft: number): Promise<void> => {
      if (retryLeft === 0) return reject();

      const isCallbackDone = await asyncCallback(settings.maxRetry - retryLeft);
      if (settings.signal?.aborted) return;

      if (isCallbackDone) return resolve();

      clearTimeout(currentTimeout);
      currentTimeout = setTimeout(async (): Promise<void> => execute(retryLeft - 1), settings.retryInterval);
    };

    settings.signal?.addEventListener("abort", (): void => abort(), { once: true });

    execute(settings.maxRetry);
  });
};

export const shiftUTCToLocale = (fromDate: Date): Date => {
  const UTCFullYear = fromDate.getUTCFullYear();
  const UTCMonth = fromDate.getUTCMonth();
  const UTCDate = fromDate.getUTCDate();
  const UTCHours = fromDate.getUTCHours();
  const UTCMinutes = fromDate.getUTCMinutes();
  const UTCSeconds = fromDate.getUTCSeconds();

  const toDate = new Date(fromDate);

  toDate.setFullYear(UTCFullYear);
  toDate.setMonth(UTCMonth);
  toDate.setDate(UTCDate);
  toDate.setHours(UTCHours);
  toDate.setMinutes(UTCMinutes);
  toDate.setSeconds(UTCSeconds);

  return toDate;
};

export const shiftLocaleToUTC = (fromDate: Date): Date => {
  const fullYear = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const date = fromDate.getDate();
  const hours = fromDate.getHours();
  const minutes = fromDate.getMinutes();
  const seconds = fromDate.getSeconds();

  const toDate = new Date(fromDate);

  toDate.setUTCFullYear(fullYear);
  toDate.setUTCMonth(month, date);
  toDate.setUTCHours(hours);
  toDate.setUTCMinutes(minutes);
  toDate.setUTCSeconds(seconds);

  return toDate;
};
export const isDateValid = (date: Date | string | number): boolean => {
  if (date instanceof Date) return !isNaN(date.getTime());

  if (typeof date === "string") {
    if (date.startsWith("0001-")) return false;
    const parsedDate = Date.parse(date);
    return !isNaN(parsedDate);
  }

  if (typeof date === "number") {
    return !isNaN(date);
  }

  return false;
};

export const clearQueryParameter = (queryParameter: string | string[]): void => {
  const searchParams = new URLSearchParams(location.search);
  const queryParameters = Array.isArray(queryParameter) ? queryParameter : [queryParameter];
  queryParameters.forEach((queryParameter): void => searchParams.delete(queryParameter));

  const queryString = searchParams.toString();

  if (!queryString) return window.history.replaceState({}, document.title, location.pathname);
  window.history.replaceState({}, document.title, `${location.pathname}?${queryString}`);
};

export const formatSIREN = (siren: Optional<string>): string => {
  if (!siren) return "";

  const groups = /([0-9]{3})([0-9]{3})([0-9]{3})/g.exec(siren) ?? [];
  if (!groups.length) return "";
  return groups.slice(1, groups.length).join(" ");
};

export const formatSIRET = (siret: Optional<string>): string => {
  if (!siret) return "";

  const groups = /([0-9]{3})([0-9]{3})([0-9]{3})([0-9]{5})/g.exec(siret) ?? [];
  if (!groups.length) return "";
  return groups.slice(1, groups.length).join(" ");
};

export const getSiteSIRET = (siret: Optional<string>): string => siret?.slice(9, 14) ?? "";

/**
 * Return a new array containing the elements of array1 that are not in array2
 * @param array1
 * @param array2
 * @returns {Array}
 * @example
 * arrayDiff([1, 2, 3], [2, 3, 4]) // [1]
 * arrayDiff([1, 2, 3], [1, 2, 3]) // []
 */
export const arrayDiff = <T>(array1: T[] | Readonly<T[]>, array2: T[] | Readonly<T[]>): T[] => {
  return array1.filter((item): boolean => !array2.includes(item));
};

/**
 * Returns the elements of an object that meet the condition specified in a callback function.
 * @param {Object} object Object to filter
 * @param {Function} predicate Function that tests each element of the object. Invoked with arguments (key, value)
 * @returns {Object} return a new object with filtered keys
 */
export const filterObject = <T extends object>(object: T, predicate: (key: keyof T, value: T[keyof T]) => boolean): T => {
  return Object.fromEntries(Object.entries(object).filter(([key, value]): boolean => predicate(key as keyof T, value))) as T;
};

export const openWindow = (url, target = "_blank"): void => {
  const link = document.createElement("a");
  link.href = url;
  link.target = target;
  link.click();
};

/**
 * Returns a new object with the specified keys.
 * @param {Object} object Object to pick
 * @param {Array} keys Array of keys to pick
 * @returns {Object} return a new object with picked keys
 */
export const pick = <T extends Record<string, unknown>>(object: T, keys: Array<keyof T>): T => {
  return filterObject(object, (key): boolean => keys.includes(String(key)));
};

/**
 * Returns a new object without the specified keys.
 * @param {Object} object Object to omit
 * @param {Array} keys Array of keys to omit
 * @returns {Object} return a new object without omitted keys
 */
export const omit = <T extends Record<string, unknown>>(object: T, keys: Array<keyof T>): T => {
  return filterObject(object, (key): boolean => !keys.includes(String(key)));
};

/**
 * Returns a new object with the specified keys and values.
 * @param {Object} object Object to pick
 */
export const clone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Returns a new object with the specified keys and values.
 * @param {Object} address Address to format
 */
export const formatAddress = (address: IAddress): string => {
  const { streetNumber, streetNumberType, street, addressSupplement, locality, zipCode, city, country } = address;
  const backspace = "\n";
  const addressArray = [
    streetNumber?.trim(),
    streetNumberType?.trim(),
    street?.trim(),
    backspace,
    addressSupplement?.trim(),
    locality?.trim(),
    backspace,
    zipCode?.trim(),
    city?.trim(),
    country?.trim()
  ];

  const formattedAddress = addressArray.reduce((acc, field, index): string[] => {
    if (!field || field === backspace && !addressArray[index - 1]) return acc;
    acc.push(field);
    return acc;
  }, [] as string[]);

  return formattedAddress.join(" ").trim();
};

