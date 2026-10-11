import { text as tr } from "../i18n";
import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useApi } from "../hooks/useApi";
import { api, errorMessage } from "../lib/api/http";
import type { Field } from "./DomainEntityTable";
function get(record: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      record,
    );
}
function set(
  record: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const [key, ...rest] = path.split(".");
  if (!key) return record;
  return {
    ...record,
    [key]: rest.length
      ? set(
          record[key] && typeof record[key] === "object"
            ? (record[key] as Record<string, unknown>)
            : {},
          rest.join("."),
          value,
        )
      : value,
  };
}
export function DomainRecordEditor({
  title,
  sections,
  endpoint,
  saveEndpoint = endpoint,
  savePath,
  fields,
  canEdit = true,
}: {
  title: string;
  sections: string[];
  endpoint: string;
  saveEndpoint?: string;
  savePath?: string;
  fields: Field[];
  canEdit?: boolean;
}) {
  const state = useApi<Record<string, unknown>>(endpoint);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (state.data) setDraft(state.data);
  }, [state.data]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await api.put(saveEndpoint, savePath ? get(draft, savePath) : draft);
      setSaved(true);
      state.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack component="form" spacing={2} onSubmit={submit}>
      <Typography component="h1" variant="h4">
        {tr(title)}
      </Typography>
      {sections.map((section) => (
        <Typography key={section} component="h2" variant="h5">
          {tr(section)}
        </Typography>
      ))}
      {(error || state.error) && (
        <Alert severity="error">{error || state.error}</Alert>
      )}
      {saved && <Alert severity="success">{tr("Saved")}</Alert>}
      {state.data &&
        fields.map((field) =>
          field.type === "boolean" ? (
            <FormControlLabel
              key={field.key}
              label={tr(field.label)}
              control={
                <Checkbox
                  disabled={!canEdit}
                  checked={!!get(draft, field.key)}
                  onChange={(e) =>
                    setDraft(set(draft, field.key, e.target.checked))
                  }
                />
              }
            />
          ) : (
            <TextField
              key={field.key}
              label={field.label}
              required={field.required}
              disabled={!canEdit}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "email"
                    ? "email"
                    : "text"
              }
              value={get(draft, field.key) ?? ""}
              onChange={(e) =>
                setDraft(
                  set(
                    draft,
                    field.key,
                    field.type === "number"
                      ? Number(e.target.value)
                      : e.target.value,
                  ),
                )
              }
            />
          ),
        )}
      {canEdit && (
        <Button type="submit" disabled={busy || state.loading}>
          {tr("Update")}
        </Button>
      )}
    </Stack>
  );
}
