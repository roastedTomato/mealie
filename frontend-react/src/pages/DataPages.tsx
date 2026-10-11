import { text as tr } from "../i18n";
import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router";
import type {
  ReportOut,
  ReportSummary,
} from "../../../frontend/app/lib/api/types/reports";
import type { Recipe } from "../../../frontend/app/lib/api/types/recipe";
import { DomainEntityTable, type Field } from "../components/DomainEntityTable";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../auth/AuthProvider";
import { api, errorMessage, request, type PageResult } from "../lib/api/http";
const datasets: Record<
  string,
  { title: string; endpoint: string; fields?: Field[] }
> = {
  foods: { title: "Food Data", endpoint: "/api/foods" },
  units: { title: "Units", endpoint: "/api/units" },
  labels: {
    title: "Labels",
    endpoint: "/api/groups/labels",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "color", label: "Color", defaultValue: "#1976D2" },
    ],
  },
  categories: {
    title: "Category Data",
    endpoint: "/api/organizers/categories",
  },
  tags: { title: "Tag Data", endpoint: "/api/organizers/tags" },
  tools: { title: "Tool Data", endpoint: "/api/organizers/tools" },
  "recipe-actions": {
    title: "Recipe Actions Data",
    endpoint: "/api/households/recipe-actions",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "url", label: "URL", required: true },
      { key: "actionType", label: "Type", defaultValue: "link" },
    ],
  },
};
export function DataPage() {
  const { dataset = "foods" } = useParams();
  const { user } = useAuth();
  const config = datasets[dataset];
  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        {tr("Data Management")}
      </Typography>
      <Typography>
        {tr("Select which data set you want to make changes to.")}
      </Typography>
      <Stack direction="row" flexWrap="wrap">
        {[...Object.keys(datasets), "recipes"].map((key) => (
          <Button key={key} component={Link} to={`/group/data/${key}`}>
            {key}
          </Button>
        ))}
      </Stack>
      {dataset === "recipes" ? (
        <RecipeData />
      ) : config ? (
        <DomainEntityTable
          key={dataset}
          {...config}
          canEdit={!!(user?.admin || user?.canOrganize)}
        />
      ) : (
        <Typography>404</Typography>
      )}
    </Stack>
  );
}
function RecipeData() {
  const { user } = useAuth();
  const state = useApi<PageResult<Recipe>>("/api/recipes?perPage=-1");
  const exports = useApi<{ id: string; name: string; filename: string }[]>(
    "/api/recipes/bulk-actions/export",
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(kind: string) {
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/recipes/bulk-actions/${kind}`, {
        recipes: selected,
        ...(kind === "export" ? { exportType: "json" } : {}),
      });
      setSelected([]);
      state.reload();
      exports.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography component="h2" variant="h5">
        {tr("Recipe Data")}
      </Typography>
      {(error || state.error || exports.error) && (
        <Alert severity="error">{error || state.error || exports.error}</Alert>
      )}
      {state.data?.items.map((recipe) => (
        <Stack key={recipe.id} direction="row">
          <Checkbox
            checked={selected.includes(recipe.id ?? "")}
            onChange={(e) =>
              setSelected(
                e.target.checked
                  ? [...selected, recipe.id ?? ""]
                  : selected.filter((id) => id !== recipe.id),
              )
            }
          />
          <Button
            component={Link}
            to={`/g/${user?.groupSlug}/r/${recipe.slug}`}
          >
            {recipe.name}
          </Button>
        </Stack>
      ))}
      <Button
        disabled={busy || !selected.length}
        onClick={() => {
          void act("export");
        }}
      >
        {tr("Export Selected")}
      </Button>
      <Button
        color="error"
        disabled={busy || !selected.length}
        onClick={() => {
          if (window.confirm("Delete selected recipes?")) void act("delete");
        }}
      >
        {tr("Delete Selected")}
      </Button>
      <Typography component="h2" variant="h5">
        {tr("Data Exports")}
      </Typography>
      {exports.data?.map((item) => (
        <Typography key={item.id}>
          {item.name} {item.filename}
        </Typography>
      ))}
    </Stack>
  );
}
export function ReportPage() {
  const { id } = useParams();
  const state = useApi<ReportOut>(`/api/groups/reports/${id}`);
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Report")}
      </Typography>
      {state.error && <Alert severity="error">{state.error}</Alert>}
      <Typography component="h2" variant="h5">
        {state.data?.name}
      </Typography>
      <Typography>{state.data?.status}</Typography>
      {state.data?.entries?.map((entry) => (
        <Alert severity={entry.success ? "success" : "error"} key={entry.id}>
          {entry.message} {entry.exception}
        </Alert>
      ))}
    </Stack>
  );
}
export function MigrationsPage() {
  const navigate = useNavigate();
  const reports = useApi<ReportSummary[]>(
    "/api/groups/reports?report_type=migration",
  );
  const [type, setType] = useState("mealie_alpha");
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose an archive");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("archive", file);
      form.set("migration_type", type);
      form.set("add_migration_tag", String(tag));
      const report = await request<ReportSummary>("/api/groups/migrations", {
        method: "POST",
        body: form,
      });
      navigate(`/group/reports/${report.id}`);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Recipe Data Migrations")}
      </Typography>
      <Typography component="h2" variant="h5">
        {tr("New Migration")}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack component="form" onSubmit={submit} spacing={2}>
        <TextField
          label={tr("Migration Type")}
          select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {[
            "mealie_alpha",
            "nextcloud",
            "chowdown",
            "copymethat",
            "paprika",
            "tandoor",
            "plantoeat",
            "myrecipebox",
            "recipekeeper",
            "cookn",
          ].map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        <Button component="label">
          {tr("Upload File")}
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Button>
        <FormControlLabel
          label={tr("Add Migration Tag")}
          control={
            <Checkbox
              checked={tag}
              onChange={(e) => setTag(e.target.checked)}
            />
          }
        />
        <Button type="submit" disabled={busy}>
          {tr("Import")}
        </Button>
      </Stack>
      {reports.error && <Alert severity="error">{reports.error}</Alert>}
      {reports.data?.map((report) => (
        <Button
          key={report.id}
          component={Link}
          to={`/group/reports/${report.id}`}
        >
          {report.name} — {report.status}
        </Button>
      ))}
    </Stack>
  );
}
