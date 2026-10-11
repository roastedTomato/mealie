import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router";
import {
  get,
  post,
  put,
  remove,
  useResource,
  errorMessage,
  type Page,
} from "../../shared/api";
import type { UserIn, UserOut } from "../../shared/types";
import { PageTitle, Section, ResourceStatus, NavLinks } from "../../shared/ui";
import { RecordForm } from "../../shared/RecordForm";
import { useText } from "../../shared/useText";
interface Named {
  id: string;
  name: string;
  groupId?: string;
}
export function AdminManagement() {
  const { resource = "users", id } = useParams();
  const t = useText();
  const valid = ["users", "groups", "households"].includes(resource);
  const base = valid ? `/api/admin/${resource}` : null;
  const result = useResource<Record<string, unknown>>(
    base ? (id ? `${base}/${id}` : `${base}?perPage=-1`) : null,
  );
  const [error, setError] = useState("");
  const singular =
    resource === "users"
      ? "User"
      : resource === "groups"
        ? "Group"
        : "Household";
  const data = result.data;
  const items =
    data && Array.isArray(data.items)
      ? (data.items as Record<string, unknown>[])
      : [];
  return (
    <>
      <PageTitle>{t(`${id ? "Admin " : ""}${singular} Management`)}</PageTitle>
      <NavLinks
        links={["users", "groups", "households"].map((x) => [
          t(x[0]?.toUpperCase() + x.slice(1)),
          `/admin/manage/${x}`,
        ])}
      />
      <ResourceStatus loading={result.loading} error={result.error || error} />
      {!valid && <Alert severity="error">Unknown resource</Alert>}
      {id && data && !Array.isArray(data.items) ? (
        <>
          <Section
            title={t(
              resource === "users" ? "User Details" : `${singular} Preferences`,
            )}
          >
            <RecordForm
              value={data}
              omit={[
                "id",
                "groupId",
                "householdId",
                "cacheKey",
                "groupSlug",
                "householdSlug",
                "authMethod",
              ]}
              onSave={async (draft) => {
                await put(`${base}/${id}`, draft);
                result.reload();
              }}
            />
          </Section>
          {resource === "users" && (
            <Section title={t("Permissions")}>
              <Typography>
                {t("Permissions are managed with the account flags above.")}
              </Typography>
            </Section>
          )}
          {Boolean(data.preferences) &&
            typeof data.preferences === "object" && (
              <Section title={t(`${singular} Preferences`)}>
                <RecordForm
                  value={data.preferences as Record<string, unknown>}
                  omit={["id", "groupId"]}
                  onSave={async (preferences) => {
                    await put(`${base}/${id}`, { ...data, preferences });
                    result.reload();
                  }}
                />
              </Section>
            )}
        </>
      ) : (
        <>
          {resource === "users" && (
            <Button component={Link} to="/admin/manage/users/create">
              {t("Create")}
            </Button>
          )}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("Name")}</TableCell>
                {resource === "users" && <TableCell>{t("Email")}</TableCell>}
                <TableCell>{t("Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((x) => (
                <TableRow key={String(x.id)}>
                  <TableCell>
                    <Link to={`/admin/manage/${resource}/${x.id}`}>
                      {String(x.name ?? x.fullName ?? x.username ?? "")}
                    </Link>
                  </TableCell>
                  {resource === "users" && (
                    <TableCell>{String(x.email ?? "")}</TableCell>
                  )}
                  <TableCell>
                    <Button
                      onClick={() => {
                        if (window.confirm(t("Delete this record?")))
                          void remove(`${base}/${x.id}`)
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
        </>
      )}
    </>
  );
}
export function CreateUser() {
  const t = useText();
  const navigate = useNavigate();
  const groups = useResource<Page<Named>>("/api/admin/groups?perPage=-1");
  const households = useResource<Page<Named>>(
    "/api/admin/households?perPage=-1",
  );
  const [draft, setDraft] = useState<UserIn>({
    username: "",
    fullName: "",
    email: "",
    password: "",
    group: "",
    household: "",
    admin: false,
    canManage: false,
    canInvite: false,
    canOrganize: false,
  });
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await post<UserOut>("/api/admin/users", draft);
      navigate("/admin/manage/users");
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <>
      <PageTitle>{t("Admin User Creation")}</PageTitle>
      <Stack component="form" spacing={2} onSubmit={submit}>
        <Section title={t("User Details")}>
          <Stack spacing={2}>
            <TextField
              select
              label={t("User Group")}
              value={draft.group ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, group: e.target.value, household: "" })
              }
              required
            >
              {groups.data?.items.map((x) => (
                <MenuItem key={x.id} value={x.name}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("User Household")}
              value={draft.household ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, household: e.target.value })
              }
              required
            >
              {households.data?.items
                .filter(
                  (x) =>
                    !draft.group ||
                    x.groupId ===
                      groups.data?.items.find((g) => g.name === draft.group)
                        ?.id,
                )
                .map((x) => (
                  <MenuItem key={x.id} value={x.name}>
                    {x.name}
                  </MenuItem>
                ))}
            </TextField>
            {(["username", "fullName", "email", "password"] as const).map(
              (key) => (
                <TextField
                  key={key}
                  label={t(
                    {
                      username: "User Name",
                      fullName: "Full Name",
                      email: "Email",
                      password: "Password",
                    }[key],
                  )}
                  type={key === "password" ? "password" : "text"}
                  slotProps={{ htmlInput: { role: "textbox" } }}
                  value={draft[key]}
                  required
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              ),
            )}
          </Stack>
        </Section>
        <Section title={t("Permissions")}>
          {(
            [
              "admin",
              "canManage",
              "canInvite",
              "canOrganize",
              "canManageHousehold",
            ] as const
          ).map((key) => (
            <FormControlLabel
              key={key}
              label={key}
              control={
                <Checkbox
                  checked={Boolean(draft[key])}
                  onChange={(_, checked) =>
                    setDraft({ ...draft, [key]: checked })
                  }
                />
              }
            />
          ))}
        </Section>
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit">{t("Create")}</Button>
      </Stack>
    </>
  );
}
export function Preferences({ household = false }: { household?: boolean }) {
  const t = useText();
  const scope = household ? "households" : "groups";
  const result = useResource<Record<string, unknown>>(`/api/${scope}/self`);
  const [error, setError] = useState("");
  const preferences = result.data?.preferences;
  return (
    <>
      <PageTitle>
        {t(household ? "Household Settings" : "Group Settings")}
      </PageTitle>
      <NavLinks
        links={
          household
            ? [
                [t("Manage Members"), "/household/members"],
                [t("Webhooks"), "/household/webhooks"],
                [t("Event Notifiers"), "/household/notifiers"],
                [t("Meal Plan Rules"), "/household/mealplan/settings"],
              ]
            : [
                [t("Data Management"), "/group/data"],
                [t("Recipe Data Migrations"), "/group/migrations"],
              ]
        }
      />
      <ResourceStatus loading={result.loading} error={result.error || error} />
      <Section
        title={t(household ? "Household Preferences" : "Group Preferences")}
      >
        {Boolean(preferences) && typeof preferences === "object" && (
          <RecordForm
            value={preferences as Record<string, unknown>}
            omit={["id", "groupId"]}
            onSave={async (values) => {
              await put(`/api/${scope}/preferences`, values);
              result.reload();
            }}
          />
        )}
      </Section>
      {!household && (
        <Button
          onClick={() =>
            void get("/api/groups/storage").catch((e: unknown) =>
              setError(errorMessage(e)),
            )
          }
        >
          {t("Storage")}
        </Button>
      )}
    </>
  );
}
export function Members() {
  const t = useText();
  const result = useResource<Page<UserOut>>(
    "/api/households/members?perPage=-1",
  );
  const [error, setError] = useState("");
  const [invite, setInvite] = useState("");
  return (
    <>
      <PageTitle>{t("Manage Members")}</PageTitle>
      <ResourceStatus loading={result.loading} error={result.error || error} />
      {result.data?.items.map((x) => (
        <Stack key={x.id} direction="row" alignItems="center" spacing={2}>
          <Typography>
            {x.fullName} ({x.email})
          </Typography>
          <FormControlLabel
            label={t("Can Manage Household")}
            control={
              <Checkbox
                checked={Boolean(x.canManageHousehold)}
                onChange={(_, checked) =>
                  void put("/api/households/permissions", {
                    userId: x.id,
                    canManageHousehold: checked,
                    canInvite: x.canInvite,
                    canManage: x.canManage,
                    canOrganize: x.canOrganize,
                  })
                    .then(result.reload)
                    .catch((e: unknown) => setError(errorMessage(e)))
                }
              />
            }
          />
        </Stack>
      ))}
      <Button
        onClick={() =>
          void post<{ token: string }>("/api/households/invitations", {
            uses: 1,
          })
            .then((x) => setInvite(x.token))
            .catch((e: unknown) => setError(errorMessage(e)))
        }
      >
        {t("Create Invitation")}
      </Button>
      {invite && <Alert>{invite}</Alert>}
    </>
  );
}
