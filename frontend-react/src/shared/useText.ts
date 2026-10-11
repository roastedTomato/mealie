import { useTranslation } from "react-i18next";
import english from "../../../frontend/app/lang/messages/en-US.json";
const keys = new Map<string, string>();
function scan(value: Record<string, unknown>, prefix = "") {
  for (const [k, v] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string" && !keys.has(v)) keys.set(v, path);
    else if (v && typeof v === "object")
      scan(v as Record<string, unknown>, path);
  }
}
scan(english);
export function useText() {
  const { t } = useTranslation();
  return (label: string) =>
    t(
      keys.get(label) ??
        `wf2.${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      { defaultValue: label },
    );
}
