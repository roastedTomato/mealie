import { ready, changeLanguage } from "./i18n";
import i18n from "./i18n";
it("loads English and persists supported locale direction", async () => {
  await ready;
  await changeLanguage("en-US");
  expect(document.documentElement.lang).toBe("en-US");
  expect(localStorage.getItem("mealie.locale")).toBe("en-US");
  expect(i18n.t("general.save")).toBe("Save");
  await expect(changeLanguage("../bad")).rejects.toThrow(
    "Unsupported language",
  );
});
