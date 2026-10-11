import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { App } from "./App";
import i18n, { i18nReady } from "./i18n";
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ allowPasswordLogin: true, allowSignup: true }),
          { status: 200 },
        ),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());
describe("SPA foundation", () => {
  it("renders shared English inside providers and redirects anonymous home to sign in", async () => {
    await i18nReady;
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
    expect(i18n.t("general.home")).toBe("Home");
  });
  it("handles unknown deep links and navigates home through the session guard", async () => {
    await i18nReady;
    render(
      <MemoryRouter initialEntries={["/missing/deep/link"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "404" })).toBeVisible();
    await userEvent.click(screen.getByRole("link", { name: "Home" }));
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
  });
  it("falls back to English for an unavailable language", async () => {
    await i18nReady;
    await i18n.changeLanguage("xx");
    expect(i18n.t("general.home")).toBe("Home");
    await i18n.changeLanguage("en-US");
  });
});
