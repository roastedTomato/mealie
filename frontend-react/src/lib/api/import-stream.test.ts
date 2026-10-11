import { describe, expect, it } from "vitest";
import { consumeImportStream } from "./import-stream";
function streamed(chunks: string[]) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks)
          controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    }),
  );
}
describe("recipe streaming import", () => {
  it("reassembles fragmented progress and result events", async () => {
    const progress: string[] = [];
    const slug = await consumeImportStream(
      streamed([
        "event: pro",
        'gress\r\ndata: {"message":"Parsing"}\r\n\r\nevent: done\n',
        'data: {"slug":"soup"}\n\n',
      ]),
      (message) => progress.push(message),
    );
    expect(slug).toBe("soup");
    expect(progress).toEqual(["Parsing"]);
  });
  it("surfaces a backend error instead of navigating to a fabricated recipe", async () => {
    await expect(
      consumeImportStream(
        streamed(['event: error\ndata: {"message":"Invalid recipe"}\n\n']),
        () => {},
      ),
    ).rejects.toThrow("Invalid recipe");
  });
  it("rejects a stream that closes without a done result", async () => {
    await expect(
      consumeImportStream(
        streamed(['event: progress\ndata: {"message":"Working"}\n\n']),
        () => {},
      ),
    ).rejects.toThrow("without a result");
  });
});
