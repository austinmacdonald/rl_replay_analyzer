const STORAGE_KEY = "ballchasing-api-token";

export function loadToken() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveToken(token) {
  try {
    const trimmed = token?.trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function authHeaders() {
  const token = loadToken();
  return token ? { Authorization: token } : {};
}

export async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...options.headers,
    },
  });
}
