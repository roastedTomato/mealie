import { useCallback, useEffect, useState } from "react";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export function tokenFromCookie(cookie = document.cookie): string | null {
  const match = cookie
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("mealie.access_token="));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(match.indexOf("=") + 1))
      .replace(/^"|"$/g, "")
      .replace(/^Bearer /i, "");
  } catch {
    return null;
  }
}
let bearer: string | null = null;
export function setBearer(token: string | null) {
  bearer = token;
}
export function clearSession() {
  bearer = null;
  document.cookie = "mealie.access_token=; Max-Age=0; path=/";
  window.dispatchEvent(new Event("mealie:logout"));
}
let refreshFlight: Promise<void> | null = null;
export async function api<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = bearer ?? tokenFromCookie();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof URLSearchParams)
  )
    headers.set("Content-Type", "application/json");
  const res = await fetch(path, { ...init, headers, credentials: "include" });
  if (res.status === 401 && retry && !path.startsWith("/api/auth/") && token) {
    refreshFlight ??= api<{ access_token: string }>(
      "/api/auth/refresh",
      { method: "POST" },
      false,
    )
      .then((x) => {
        bearer = x.access_token;
      })
      .finally(() => {
        refreshFlight = null;
      });
    try {
      await refreshFlight;
      return await api<T>(path, init, false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) clearSession();
      throw error;
    }
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === "object" && "detail" in body)
        message =
          typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail);
    } catch {
      /* Non-JSON error bodies use the HTTP status. */
    }
    throw new ApiError(res.status, message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.text();
  return (body ? JSON.parse(body) : undefined) as T;
}
export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body: unknown = {}) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const put = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const remove = <T>(path: string) => api<T>(path, { method: "DELETE" });
export interface Page<T> {
  items: T[];
  total: number;
  page?: number;
  totalPages?: number;
}
export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(path));
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    get<T>(path)
      .then((x) => {
        if (active) setData(x);
      })
      .catch((e: unknown) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return { data, setData, error, loading, reload };
}
export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
