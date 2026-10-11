import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../../../frontend/app/lang/messages/en-US.json";
function convert(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [
      k,
      typeof v === "string"
        ? v.replace(/(?<!\{)\{([\w-]+)\}(?!\})/g, "{{$1}}")
        : v && typeof v === "object"
          ? convert(v as Record<string, unknown>)
          : v,
    ]),
  );
}
export const ready = i18n
  .use(initReactI18next)
  .init({
    lng: "en-US",
    fallbackLng: "en-US",
    resources: { "en-US": { translation: convert(en) } },
    interpolation: { escapeValue: false },
  });
const loaders = import.meta.glob<{ default: Record<string, unknown> }>(
  "../../../frontend/app/lang/messages/*.json",
);
export const languages = Object.keys(loaders)
  .map((p) => p.split("/").pop()?.replace(".json", ""))
  .filter((x): x is string => Boolean(x));
export async function changeLanguage(code: string) {
  await ready;
  const load = loaders[`../../../frontend/app/lang/messages/${code}.json`];
  if (!load) throw new Error("Unsupported language");
  if (!i18n.hasResourceBundle(code, "translation"))
    i18n.addResourceBundle(
      code,
      "translation",
      convert((await load()).default),
    );
  await i18n.changeLanguage(code);
  document.documentElement.lang = code;
  document.documentElement.dir = i18n.dir();
  localStorage.setItem("mealie.locale", code);
}
export default i18n;
