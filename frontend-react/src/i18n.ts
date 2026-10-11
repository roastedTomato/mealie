import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import english from "../../frontend/app/lang/messages/en-US.json";
import { LOCALES } from "../../frontend/app/composables/use-locales/available-locales";
const loaders = import.meta.glob<{ default: Record<string, unknown> }>([
  "../../frontend/app/lang/messages/*.json",
  "!../../frontend/app/lang/messages/en-US.json",
]);
export const locales = LOCALES.filter(
  (locale) =>
    locale.value === "en-US" ||
    loaders[`../../frontend/app/lang/messages/${locale.value}.json`],
);
function normalize(source: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      typeof value === "string"
        ? value.replace(/(?<!\{)\{([\w-]+)\}(?!\})/g, "{{$1}}")
        : value && typeof value === "object"
          ? normalize(value as Record<string, unknown>)
          : value,
    ]),
  );
}
const lookup = new Map<string, string>();
function index(source: Record<string, unknown>, prefix = "") {
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string" && !lookup.has(value))
      lookup.set(value, path);
    else if (value && typeof value === "object")
      index(value as Record<string, unknown>, path);
  }
}
index(english);
export function text(englishText: string): string {
  const key = lookup.get(englishText);
  return key ? i18n.t(key, { defaultValue: englishText }) : englishText;
}
export const i18nReady = i18n.use(initReactI18next).init({
  resources: { "en-US": { translation: normalize(english) } },
  lng: "en-US",
  fallbackLng: "en-US",
  interpolation: { escapeValue: false },
});
export async function changeLocale(code: string) {
  await i18nReady;
  const loader = loaders[`../../frontend/app/lang/messages/${code}.json`];
  if (!loader && code !== "en-US") throw new Error("Unsupported language");
  if (loader && !i18n.hasResourceBundle(code, "translation"))
    i18n.addResourceBundle(
      code,
      "translation",
      normalize((await loader()).default),
      true,
      true,
    );
  await i18n.changeLanguage(code);
  document.documentElement.lang = code;
  document.documentElement.dir =
    locales.find((locale) => locale.value === code)?.dir ?? "ltr";
  localStorage.setItem("mealie.locale", code);
}
export default i18n;
