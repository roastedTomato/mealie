import { text as tr } from "../i18n";
import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  AllBackups,
  MaintenanceSummary,
} from "../../../frontend/app/lib/api/types/admin";
import { useApi } from "../hooks/useApi";
import { api, errorMessage } from "../lib/api/http";
export function BackupsPage() {
  const state = useApi<AllBackups>("/api/admin/backups");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(path: string, method: "post" | "delete" = "post") {
    setBusy(true);
    setError("");
    try {
      await api[method](path);
      state.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Backups")}
      </Typography>
      {(error || state.error) && (
        <Alert severity="error">{error || state.error}</Alert>
      )}
      <Button
        disabled={busy}
        onClick={() => {
          void act("/api/admin/backups");
        }}
      >
        {tr("Create A Backup")}
      </Button>
      {state.data?.imports.map((item) => (
        <Stack key={item.name} direction="row">
          <Typography>
            {item.name} {item.date} {item.size}
          </Typography>
          <Button
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  `Restore ${item.name}? This replaces current data.`,
                )
              )
                void act(
                  `/api/admin/backups/${encodeURIComponent(item.name)}/restore`,
                );
            }}
          >
            {tr("Restore")}
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Delete ${item.name}?`))
                void act(
                  `/api/admin/backups/${encodeURIComponent(item.name)}`,
                  "delete",
                );
            }}
          >
            {tr("Delete")}
          </Button>
        </Stack>
      ))}
    </Stack>
  );
}
export function MaintenancePage() {
  const state = useApi<MaintenanceSummary>("/api/admin/maintenance");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Site Maintenance")}
      </Typography>
      <Typography component="h2" variant="h5">
        {tr("Summary")}
      </Typography>
      {(error || state.error) && (
        <Alert severity="error">{error || state.error}</Alert>
      )}
      {state.data &&
        Object.entries(state.data).map(([key, value]) => (
          <Typography key={key}>
            {key}: {String(value)}
          </Typography>
        ))}
      <Typography component="h2" variant="h5">
        {tr("Actions")}
      </Typography>
      {["temp", "images", "recipe-folders", "logs"].map((kind) => (
        <Button
          key={kind}
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Clean ${kind}?`)) {
              setBusy(true);
              void api
                .post(`/api/admin/maintenance/clean/${kind}`, {})
                .then(() => state.reload())
                .catch((reason: unknown) => setError(errorMessage(reason)))
                .finally(() => setBusy(false));
            }
          }}
        >
          {tr("Clean")}
          {kind}
        </Button>
      ))}
    </Stack>
  );
}
export function ParserDebugPage() {
  const [ingredient, setIngredient] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      setResult(
        JSON.stringify(
          await api.post("/api/parser/ingredient", {
            ingredient,
            parser: "nlp",
          }),
          null,
          2,
        ),
      );
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }
  return (
    <Stack component="form" spacing={2} onSubmit={submit}>
      <Typography component="h1" variant="h4">
        {tr("Ingredients Natural Language Processor")}
      </Typography>
      <Button onClick={() => setIngredient("2 cups of flour")}>
        {tr("Try an example")}
      </Button>
      <TextField
        label={tr("Ingredient")}
        required
        value={ingredient}
        onChange={(e) => setIngredient(e.target.value)}
      />
      <Button type="submit">{tr("Parse")}</Button>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography component="pre" sx={{ whiteSpace: "pre-wrap" }}>
        {result}
      </Typography>
    </Stack>
  );
}
export function AiDebugPage() {
  const settings = useApi<{ providers: { id: string; name: string }[] }>(
    "/api/groups/ai-providers/settings",
  );
  const [provider, setProvider] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Debug OpenAI Services")}
      </Typography>
      {(error || settings.error) && (
        <Alert severity="error">{error || settings.error}</Alert>
      )}
      <TextField
        select
        label={tr("Provider")}
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
      >
        {settings.data?.providers.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
      </TextField>
      <Button
        disabled={!provider || busy}
        onClick={() => {
          setBusy(true);
          void api
            .post(`/api/admin/debug/openai/${provider}`)
            .then((value) => setResult(JSON.stringify(value, null, 2)))
            .catch((reason: unknown) => setError(errorMessage(reason)))
            .finally(() => setBusy(false));
        }}
      >
        {tr("Test Provider")}
      </Button>
      <Typography component="pre" sx={{ whiteSpace: "pre-wrap" }}>
        {result}
      </Typography>
    </Stack>
  );
}
