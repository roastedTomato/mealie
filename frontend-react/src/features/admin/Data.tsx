import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router";
import {
  api,
  post,
  put,
  remove,
  useResource,
  errorMessage,
  type Page,
} from "../../shared/api";
import { PageTitle, Section, ResourceStatus, NavLinks } from "../../shared/ui";
import { RecordForm } from "../../shared/RecordForm";
import { useText } from "../../shared/useText";
import type {
  ReportOut,
  ReportSummary,
} from "../../../../frontend/app/lib/api/types/reports";
interface Dataset {
  title: string;
  path: string;
  defaults: Record<string, unknown>;
}
const datasets: Record<string, Dataset> = {
  foods: {
    title: "Food Data",
    path: "/api/foods",
    defaults: { name: "", description: "" },
  },
  units: {
    title: "Units",
    path: "/api/units",
    defaults: {
      name: "",
      description: "",
      abbreviation: "",
      fraction: true,
      useAbbreviation: false,
    },
  },
  labels: {
    title: "Labels",
    path: "/api/groups/labels",
    defaults: { name: "", color: "#e58325" },
  },
  categories: {
    title: "Category Data",
    path: "/api/organizers/categories",
    defaults: { name: "" },
  },
  tags: {
    title: "Tag Data",
    path: "/api/organizers/tags",
    defaults: { name: "" },
  },
  tools: {
    title: "Tool Data",
    path: "/api/organizers/tools",
    defaults: { name: "" },
  },
  "recipe-actions": {
    title: "Recipe Actions Data",
    path: "/api/households/recipe-actions",
    defaults: { title: "", url: "", actionType: "link" },
  },
  recipes: {
    title: "Recipe Data",
    path: "/api/recipes",
    defaults: { name: "" },
  },
};
export function DataPage() {
  const { dataset = "foods" } = useParams();
  const t = useText();
  const config = datasets[dataset];
  const result = useResource<Page<Record<string, unknown>>>(
    config ? `${config.path}?perPage=-1` : null,
  );
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [exported, setExported] = useState("");
  return (
    <>
      <PageTitle>{t("Data Management")}</PageTitle>
      <Typography sx={{ mb: 2 }}>
        {t("Select which data set you want to make changes to.")}
      </Typography>
      <NavLinks
        links={Object.entries(datasets).map(([k, x]) => [
          t(x.title),
          `/group/data/${k}`,
        ])}
      />
      {config ? (
        <>
          <Section title={t(config.title)}>
            <ResourceStatus
              loading={result.loading}
              error={result.error || error}
            />
            <Button onClick={() => setEditing(config.defaults)}>
              {t("Create")}
            </Button>
            <Table>
              <TableBody>
                {result.data?.items.map((x) => (
                  <TableRow key={String(x.id)}>
                    <TableCell>{String(x.name ?? x.title ?? "")}</TableCell>
                    <TableCell>
                      <Button onClick={() => setEditing(x)}>{t("Edit")}</Button>
                      <Button
                        onClick={() => {
                          if (window.confirm(t("Delete this record?")))
                            void remove(
                              `${config.path}/${dataset === "recipes" ? x.slug : x.id}`,
                            )
                              .then(result.reload)
                              .catch((e: unknown) => setError(errorMessage(e)));
                        }}
                      >
                        {t("Delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>
          {dataset === "recipes" && (
            <Section title={t("Data Exports")}>
              <Button
                onClick={() =>
                  void post<{ id?: string }>(
                    "/api/recipes/bulk-actions/export",
                    {
                      recipes: result.data?.items.map((x) => x.id) ?? [],
                      exportType: "json",
                    },
                  )
                    .then((x) => setExported(JSON.stringify(x)))
                    .catch((e: unknown) => setError(errorMessage(e)))
                }
              >
                {t("Export")}
              </Button>
              {exported && <Typography>{exported}</Typography>}
            </Section>
          )}
          <Dialog
            open={Boolean(editing)}
            onClose={() => setEditing(null)}
            fullWidth
          >
            <DialogTitle>{t(editing?.id ? "Edit" : "Create")}</DialogTitle>
            <DialogContent>
              {editing && (
                <RecordForm
                  value={editing}
                  omit={["id", "groupId", "slug", "householdId"]}
                  onSave={async (value) => {
                    if (value.id)
                      await put(
                        `${config.path}/${dataset === "recipes" ? value.slug : value.id}`,
                        value,
                      );
                    else await post(config.path, value);
                    setEditing(null);
                    result.reload();
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Alert severity="error">Unknown dataset</Alert>
      )}
    </>
  );
}
export function Integrations() {
  const { integration = "webhooks" } = useParams();
  const t = useText();
  const webhook = integration === "webhooks";
  const path = webhook
    ? "/api/households/webhooks"
    : "/api/households/events/notifications";
  const result = useResource<Page<Record<string, unknown>>>(
    `${path}?perPage=-1`,
  );
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  return (
    <>
      <PageTitle>{t(webhook ? "Webhooks" : "Event Notifiers")}</PageTitle>
      <ResourceStatus loading={result.loading} error={result.error || error} />
      <Button
        onClick={() =>
          setEditing(
            webhook
              ? {
                  name: "",
                  url: "",
                  scheduledTime: "00:00",
                  enabled: true,
                  webhookType: "mealplan",
                }
              : { name: "", appriseUrl: "" },
          )
        }
      >
        {t("Create")}
      </Button>
      {result.data?.items.map((x) => (
        <Stack direction="row" key={String(x.id)} alignItems="center">
          <Typography>{String(x.name)}</Typography>
          <Button onClick={() => setEditing(x)}>{t("Edit")}</Button>
          <Button
            onClick={() =>
              void post(`${path}/${x.id}/test`).catch((e: unknown) =>
                setError(errorMessage(e)),
              )
            }
          >
            {t("Test")}
          </Button>
          <Button
            onClick={() =>
              void remove(`${path}/${x.id}`)
                .then(result.reload)
                .catch((e: unknown) => setError(errorMessage(e)))
            }
          >
            {t("Delete")}
          </Button>
        </Stack>
      ))}
      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        fullWidth
      >
        <DialogTitle>{t("Edit")}</DialogTitle>
        <DialogContent>
          {editing && (
            <RecordForm
              value={editing}
              omit={["id", "groupId", "householdId"]}
              onSave={async (values) => {
                if (values.id) await put(`${path}/${values.id}`, values);
                else await post(path, values);
                setEditing(null);
                result.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
export function Migrations() {
  const t = useText();
  const navigate = useNavigate();
  const reports = useResource<ReportSummary[]>(
    "/api/groups/reports?report_type=migration",
  );
  const [kind, setKind] = useState("mealie_alpha");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    const body = new FormData();
    body.append("archive", file);
    body.append("migration_type", kind);
    body.append("add_migration_tag", "true");
    try {
      const x = await api<ReportSummary>("/api/groups/migrations", {
        method: "POST",
        body,
      });
      navigate(`/group/reports/${x.id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <>
      <PageTitle>{t("Recipe Data Migrations")}</PageTitle>
      <Section title={t("New Migration")}>
        <Stack component="form" onSubmit={submit} spacing={2}>
          <TextField
            select
            label={t("Migration Type")}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
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
            ].map((x) => (
              <MenuItem value={x} key={x}>
                {x}
              </MenuItem>
            ))}
          </TextField>
          <Typography>{t("Upload File")}</Typography>
          <input
            type="file"
            aria-label={t("Upload File")}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button disabled={!file} type="submit">
            {t("Start")}
          </Button>
        </Stack>
      </Section>
      <ResourceStatus
        loading={reports.loading}
        error={reports.error || error}
      />
      {reports.data?.map((x) => (
        <Typography component={Link} key={x.id} to={`/group/reports/${x.id}`}>
          {x.name}
        </Typography>
      ))}
    </>
  );
}
export function Report() {
  const { id } = useParams();
  const t = useText();
  const result = useResource<ReportOut>(`/api/groups/reports/${id}`);
  return (
    <>
      <PageTitle>{t("Report")}</PageTitle>
      <ResourceStatus loading={result.loading} error={result.error} />
      <Typography component="h2">{result.data?.name}</Typography>
      {result.data?.entries?.map((x) => (
        <Alert severity={x.success ? "success" : "error"} key={x.id}>
          {x.message}
        </Alert>
      ))}
    </>
  );
}
