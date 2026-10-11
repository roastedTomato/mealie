import { readTokenCookie } from "../../auth/token";
export const TOKEN_NAME = "mealie.access_token";
export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(typeof detail === "string" ? detail : `Request failed (${status})`);
  }
}
let refreshInFlight: Promise<void> | null = null;
export function clearSessionCookie() {
  const embedded = location.protocol === "https:" && window.self !== window.top;
  document.cookie = `${TOKEN_NAME}=; Path=/; Max-Age=0; SameSite=${embedded ? "None; Secure; Partitioned" : "Lax"}`;
  window.dispatchEvent(new Event("mealie:logout"));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("mealie-session");
    channel.postMessage("logout");
    channel.close();
  }
}
export async function refreshToken(): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      await request("/api/auth/refresh", { method: "POST" }, false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401)
        clearSessionCookie();
      throw error;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}
export async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = readTokenCookie(TOKEN_NAME);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string")
    headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  if (
    response.status === 401 &&
    retry &&
    token &&
    !path.startsWith("/api/auth/")
  ) {
    await refreshToken();
    return request<T>(path, init, false);
  }
  const text = await response.text();
  const body: unknown = text
    ? (() => {
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return text;
        }
      })()
    : undefined;
  if (!response.ok) {
    if (response.status === 401 && token && !path.startsWith("/api/auth/"))
      clearSessionCookie();
    const detail =
      body && typeof body === "object" && "detail" in body ? body.detail : body;
    throw new ApiError(response.status, detail);
  }
  return body as T;
}
export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
export function errorMessage(error: unknown): string {
  if (
    error instanceof ApiError &&
    typeof error.detail === "object" &&
    error.detail &&
    "message" in error.detail &&
    typeof error.detail.message === "string"
  )
    return error.detail.message;
  return error instanceof Error ? error.message : "Unable to complete request";
}
