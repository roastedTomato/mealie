import { readTokenCookie } from "../../auth/token";
import { ApiError, TOKEN_NAME } from "./http";
export async function consumeImportStream(
  response: Response,
  onProgress: (message: string) => void,
): Promise<string> {
  if (!response.ok) throw new ApiError(response.status, await response.text());
  if (!response.body) throw new Error("Empty import stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  function event(block: string): string | null {
    const lines = block.split("\n");
    const kind = lines
      .find((line) => line.startsWith("event:"))
      ?.slice(6)
      .trim();
    const raw = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!raw) return null;
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== "object")
      throw new Error("Invalid import event");
    if (kind === "error")
      throw new Error(
        "message" in payload ? String(payload.message) : "Recipe import failed",
      );
    if (kind === "progress" && "message" in payload)
      onProgress(String(payload.message));
    if (
      kind === "done" &&
      "slug" in payload &&
      typeof payload.slug === "string"
    )
      return payload.slug;
    return null;
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      buffer = buffer.replace(/\r\n/g, "\n");
      let index: number;
      while ((index = buffer.indexOf("\n\n")) >= 0) {
        const slug = event(buffer.slice(0, index));
        buffer = buffer.slice(index + 2);
        if (slug) return slug;
      }
      if (done) {
        if (buffer.trim()) {
          const slug = event(buffer);
          if (slug) return slug;
        }
        break;
      }
    }
    throw new Error("Recipe import ended without a result");
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
export async function importRecipe(
  path: string,
  payload: object | FormData,
  onProgress: (message: string) => void,
) {
  const headers = new Headers({
    "Accept-Language": document.documentElement.lang || "en-US",
  });
  const token = readTokenCookie(TOKEN_NAME);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(payload instanceof FormData))
    headers.set("Content-Type", "application/json");
  return consumeImportStream(
    await fetch(path, {
      method: "POST",
      headers,
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
      credentials: "include",
    }),
    onProgress,
  );
}
