import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";
import { errorMessage } from "./api";
import { useText } from "./useText";
export function parseRecord(text: string): Record<string, unknown> {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Enter a JSON object");
  return value as Record<string, unknown>;
}
export function RecordForm({
  value,
  onSave,
  omit = [],
}: {
  value: Record<string, unknown>;
  onSave: (value: Record<string, unknown>) => Promise<void>;
  omit?: string[];
}) {
  const t = useText();
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setDraft(value);
    setSaved(false);
  }, [value]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(draft);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack component="form" spacing={2} onSubmit={submit}>
      {Object.entries(draft)
        .filter(([key]) => !omit.includes(key))
        .map(([key, v]) =>
          typeof v === "boolean" ? (
            <FormControlLabel
              key={key}
              label={t(
                key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (c) => c.toUpperCase()),
              )}
              control={
                <Checkbox
                  checked={v}
                  onChange={(_, checked) =>
                    setDraft({ ...draft, [key]: checked })
                  }
                />
              }
            />
          ) : typeof v === "string" || typeof v === "number" ? (
            <TextField
              key={key}
              label={t(
                key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (c) => c.toUpperCase()),
              )}
              type={typeof v === "number" ? "number" : "text"}
              value={v}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  [key]:
                    typeof v === "number"
                      ? Number(e.target.value)
                      : e.target.value,
                })
              }
            />
          ) : null,
        )}
      {error && <Alert severity="error">{error}</Alert>}
      {saved && <Alert severity="success">{t("Saved")}</Alert>}
      <Button type="submit" disabled={busy}>
        {t("Save")}
      </Button>
    </Stack>
  );
}
