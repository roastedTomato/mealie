import { useState } from "react";
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { post, remove, useResource, errorMessage } from "../../shared/api";
import { PageTitle, Section, ResourceStatus, NavLinks } from "../../shared/ui";
import { useText } from "../../shared/useText";
import type {
  AdminAboutInfo,
  AppStatistics,
  AllBackups,
  MaintenanceSummary,
} from "../../../../frontend/app/lib/api/types/admin";
import type { AIProviderSettingsOut } from "../../../../frontend/app/lib/api/types/group";
import { ProfileEditPage } from "../account/ProfilePages";
export function SiteSettings() {
  const t = useText();
  const info = useResource<AdminAboutInfo>("/api/admin/about");
  const stats = useResource<AppStatistics>("/api/admin/about/statistics");
  return (
    <>
      <PageTitle>{t("Site Settings")}</PageTitle>
      <NavLinks
        links={[
          [t("User Management"), "/admin/manage/users"],
          [t("Group Management"), "/admin/manage/groups"],
          [t("Household Management"), "/admin/manage/households"],
          [t("Backups"), "/admin/backups"],
          [t("Site Maintenance"), "/admin/maintenance"],
          [t("Debug OpenAI Services"), "/admin/debug/openai"],
          [t("Ingredients Natural Language Processor"), "/admin/debug/parser"],
        ]}
      />
      <Section title={t("Configuration")}>
        <ResourceStatus loading={info.loading} error={info.error} />
        {info.data &&
          Object.entries(info.data).map(([k, v]) => (
            <Typography key={k}>
              {k}: {String(v)}
            </Typography>
          ))}
      </Section>
      <Section title={t("Site Statistics")}>
        <ResourceStatus loading={stats.loading} error={stats.error} />
        {stats.data &&
          Object.entries(stats.data).map(([k, v]) => (
            <Typography key={k}>
              {k}: {String(v)}
            </Typography>
          ))}
      </Section>
    </>
  );
}
export function Setup() {
  const t = useText();
  return (
    <>
      <PageTitle>{t("Welcome to Mealie! Let's get started")}</PageTitle>
      <Section title={t("Account Details")}>
        <ProfileEditPage />
      </Section>
    </>
  );
}
export function Backups() {
  const t = useText();
  const data = useResource<AllBackups>("/api/admin/backups");
  const [error, setError] = useState("");
  return (
    <>
      <PageTitle>{t("Backups")}</PageTitle>
      <ResourceStatus loading={data.loading} error={data.error || error} />
      <Button
        onClick={() =>
          void post("/api/admin/backups")
            .then(data.reload)
            .catch((e: unknown) => setError(errorMessage(e)))
        }
      >
        {t("Create A Backup")}
      </Button>
      {data.data?.imports.map((x) => (
        <Stack key={x.name} direction="row" alignItems="center">
          <Typography>
            {x.name} ({x.size})
          </Typography>
          <Button
            onClick={() =>
              void post(
                `/api/admin/backups/${encodeURIComponent(x.name)}/restore`,
              )
                .then(data.reload)
                .catch((e: unknown) => setError(errorMessage(e)))
            }
          >
            {t("Restore")}
          </Button>
          <Button
            onClick={() =>
              void remove(`/api/admin/backups/${encodeURIComponent(x.name)}`)
                .then(data.reload)
                .catch((e: unknown) => setError(errorMessage(e)))
            }
          >
            {t("Delete")}
          </Button>
        </Stack>
      ))}
    </>
  );
}
export function Maintenance() {
  const t = useText();
  const result = useResource<MaintenanceSummary>("/api/admin/maintenance");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <PageTitle>{t("Site Maintenance")}</PageTitle>
      <Section title={t("Summary")}>
        <ResourceStatus
          loading={result.loading}
          error={result.error || error}
        />
        {result.data &&
          Object.entries(result.data).map(([k, v]) => (
            <Typography key={k}>
              {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </Typography>
          ))}
      </Section>
      <Section title={t("Actions")}>
        {["temp", "images", "recipe-folders", "logs"].map((x) => (
          <Button
            key={x}
            onClick={() => {
              if (window.confirm(t("Run maintenance action?")))
                void post(`/api/admin/maintenance/clean/${x}`)
                  .then(() => {
                    setMessage("Completed");
                    result.reload();
                  })
                  .catch((e: unknown) => setError(errorMessage(e)));
            }}
          >
            {t(`Clean ${x}`)}
          </Button>
        ))}
      </Section>
      {message && <Alert>{message}</Alert>}
    </>
  );
}
export function Parser() {
  const t = useText();
  const [ingredient, setIngredient] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <PageTitle>{t("Ingredients Natural Language Processor")}</PageTitle>
      <Stack spacing={2}>
        <Button onClick={() => setIngredient("2 cups flour")}>
          {t("Try an example")}
        </Button>
        <TextField
          multiline
          label={t("Ingredient")}
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
        />
        <Button
          disabled={!ingredient.trim()}
          onClick={() =>
            void post("/api/parser/ingredient", { ingredient, parser: "nlp" })
              .then((x) => setResult(JSON.stringify(x, null, 2)))
              .catch((e: unknown) => setError(errorMessage(e)))
          }
        >
          {t("Parse")}
        </Button>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography component="pre" sx={{ whiteSpace: "pre-wrap" }}>
          {result}
        </Typography>
      </Stack>
    </>
  );
}
export function AiDebug() {
  const t = useText();
  const providers = useResource<AIProviderSettingsOut>(
    "/api/groups/ai-providers/settings",
  );
  const [provider, setProvider] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <PageTitle>{t("Debug OpenAI Services")}</PageTitle>
      <ResourceStatus
        loading={providers.loading}
        error={providers.error || error}
      />
      <TextField
        select
        fullWidth
        label={t("Provider")}
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
      >
        {providers.data?.providers.map((x) => (
          <MenuItem key={x.id} value={x.id}>
            {x.name}
          </MenuItem>
        ))}
      </TextField>
      <Button
        disabled={!provider}
        onClick={() =>
          void post(`/api/admin/debug/openai/${provider}`)
            .then((x) => setMessage(JSON.stringify(x)))
            .catch((e: unknown) => setError(errorMessage(e)))
        }
      >
        {t("Test")}
      </Button>
      {message && <Typography>{message}</Typography>}
    </>
  );
}
