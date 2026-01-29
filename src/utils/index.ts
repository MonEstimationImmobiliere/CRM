/**
 * @param key cookie KeyOf
 * @param value cookie value
 * @param expires Cookie expiration time (number of days), not passing it will expire after the session is closed, passing a negative parameter will clear that cookie.
 * @param path Cookie effective path scope, default to "/" globally effective.
 */
export function setCookie(
  key: string,
  value: string | number,
  expires: number = 0,
  path: string = '/'
) {
  let cookie = `${key}=${encodeURIComponent(value)};path=${path};${import.meta.env.MODE === 'production' ? 'SameSite=None;Secure' : ''}`;
  if (expires !== 0) {
    const date = new Date();
    date.setDate(date.getDate() + expires);
    cookie += `;expires=${date.toUTCString()}`;
  }
  document.cookie = cookie;
}

/**
 * @param key
 * @returns
 */
export function getCookie(key: string) {
  const reg = new RegExp('(^| )' + encodeURIComponent(key) + '=([^;]+)');
  const match = document.cookie.match(reg);
  return match ? decodeURIComponent(match[2]) : '';
}

/**
 * @param key
 */
export function removeCookie(key: string) {
  setCookie(key, '', -1);
}
