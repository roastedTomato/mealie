import { describe, expect, it } from "vitest";
import i18n, { changeLocale, i18nReady, locales, text } from "./i18n";
describe("preserved locale resources", () => {
  it("loads the original Chinese locale and restores English", async () => {
    await i18nReady;
    expect(locales.some((locale) => locale.value === "en-US")).toBe(true);
    try {
      await changeLocale("zh-CN");
      expect(i18n.resolvedLanguage).toBe("zh-CN");
      expect(text("Home")).toBe(i18n.t("general.home"));
      expect(text("Home")).not.toBe("Home");
      expect(document.documentElement.lang).toBe("zh-CN");
    } finally {
      await changeLocale("en-US");
    }
  });
  it("rejects unsupported language codes without changing language", async () => {
    await expect(changeLocale("../outside")).rejects.toThrow(
      "Unsupported language",
    );
    expect(i18n.resolvedLanguage).toBe("en-US");
  });
});
