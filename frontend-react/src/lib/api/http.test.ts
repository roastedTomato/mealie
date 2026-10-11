import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  api,
  ApiError,
  clearSessionCookie,
  refreshToken,
  TOKEN_NAME,
} from "./http";
beforeEach(() => {
  document.cookie = `${TOKEN_NAME}=a.valid.token; Path=/`;
});
afterEach(() => {
  clearSessionCookie();
  vi.unstubAllGlobals();
});
const response = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status });
describe("typed HTTP session transport", () => {
  it("attaches the cookie bearer and retries once with the refreshed token", async () => {
    const sent: string[] = [];
    let attempts = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (path: string, init: RequestInit) => {
        if (path === "/api/auth/refresh") {
          document.cookie = `${TOKEN_NAME}=a.fresh.token; Path=/`;
          return response(200);
        }
        sent.push(new Headers(init.headers).get("Authorization") ?? "");
        return response(++attempts === 1 ? 401 : 200, { ok: true });
      }),
    );
    expect(await api.get("/api/recipes")).toEqual({ ok: true });
    expect(sent).toEqual(["Bearer a.valid.token", "Bearer a.fresh.token"]);
  });
  it("deduplicates overlapping refreshes", async () => {
    let release: (() => void) | undefined;
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          release = () => resolve(response(200));
        }),
    );
    vi.stubGlobal("fetch", fetcher);
    const first = refreshToken();
    const second = refreshToken();
    release?.();
    await Promise.all([first, second]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("stops after one replay and does not loop", async () => {
    const fetcher = vi.fn(async (path: string) =>
      response(path === "/api/auth/refresh" ? 200 : 401),
    );
    vi.stubGlobal("fetch", fetcher);
    await expect(api.get("/api/recipes")).rejects.toBeInstanceOf(ApiError);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("clears a dead session when refresh is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response(401)),
    );
    await expect(refreshToken()).rejects.toBeInstanceOf(ApiError);
    expect(document.cookie).not.toContain(TOKEN_NAME);
  });
  it("keeps the session on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    await expect(refreshToken()).rejects.toThrow("offline");
    expect(document.cookie).toContain(TOKEN_NAME);
  });
  it("does not refresh a rejected password login", async () => {
    const fetcher = vi.fn(async () => response(401));
    vi.stubGlobal("fetch", fetcher);
    await expect(api.post("/api/auth/token")).rejects.toBeInstanceOf(ApiError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
