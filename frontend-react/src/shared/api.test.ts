import { api, ApiError, setBearer, tokenFromCookie } from "./api";
import { vi, describe, it, expect, afterEach } from "vitest";
afterEach(() => {
  setBearer(null);
  vi.unstubAllGlobals();
});
describe("API contract", () => {
  it("reads quoted encoded token and rejects malformed encoding", () => {
    expect(tokenFromCookie("x=1; mealie.access_token=%22abc%22")).toBe("abc");
    expect(tokenFromCookie("mealie.access_token=%ZZ")).toBeNull();
    expect(tokenFromCookie("")).toBeNull();
  });
  it("sends bearer credentials and handles empty success", async () => {
    setBearer("token");
    const request = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", request);
    expect(await api("/api/test")).toBeUndefined();
    expect(
      new Headers(request.mock.calls[0]?.[1].headers).get("Authorization"),
    ).toBe("Bearer token");
    expect(request.mock.calls[0]?.[1].credentials).toBe("include");
  });
  it("preserves structured API failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ detail: "Denied" }), { status: 403 }),
        ),
    );
    await expect(api("/api/test")).rejects.toEqual(new ApiError(403, "Denied"));
  });
  it("refreshes and retries expired authentication", async () => {
    setBearer("old");
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(new Response('{"access_token":"new"}'))
      .mockResolvedValueOnce(new Response('{"ok":true}'));
    vi.stubGlobal("fetch", request);
    expect(await api("/api/test")).toEqual({ ok: true });
    expect(request.mock.calls[1]?.[0]).toBe("/api/auth/refresh");
    expect(
      new Headers(request.mock.calls[2]?.[1].headers).get("Authorization"),
    ).toBe("Bearer new");
  });
});
