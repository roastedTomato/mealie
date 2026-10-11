import { text as tr } from "../i18n";
import { useState, type FormEvent } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router";
import { DomainEntityTable, type Field } from "../components/DomainEntityTable";
import { DomainRecordEditor } from "../components/DomainRecordEditor";
import { useAuth } from "../auth/AuthProvider";
import { useApi } from "../hooks/useApi";
import { api, errorMessage, type PageResult } from "../lib/api/http";
const groupFields: Field[] = [
  { key: "preferences.privateGroup", label: "Private Group", type: "boolean" },
  {
    key: "preferences.showAnnouncements",
    label: "Show Announcements",
    type: "boolean",
  },
];
const householdFields: Field[] = [
  {
    key: "preferences.privateHousehold",
    label: "Private Household",
    type: "boolean",
  },
  {
    key: "preferences.lockRecipeEditsFromOtherHouseholds",
    label: "Lock Recipe Edits",
    type: "boolean",
  },
  { key: "preferences.recipePublic", label: "Public Recipes", type: "boolean" },
  {
    key: "preferences.recipeShowNutrition",
    label: "Show Nutrition",
    type: "boolean",
  },
  {
    key: "preferences.recipeShowAssets",
    label: "Show Assets",
    type: "boolean",
  },
  {
    key: "preferences.recipeLandscapeView",
    label: "Landscape View",
    type: "boolean",
  },
  {
    key: "preferences.recipeDisableComments",
    label: "Disable Comments",
    type: "boolean",
  },
  {
    key: "preferences.firstDayOfWeek",
    label: "First Day Of Week",
    type: "number",
  },
];
const userFields: Field[] = [
  { key: "username", label: "User Name", required: true },
  { key: "fullName", label: "Full Name", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "admin", label: "Administrator", type: "boolean" },
  ...["canInvite", "canManage", "canManageHousehold", "canOrganize"].map(
    (key) => ({ key, label: key, type: "boolean" as const }),
  ),
];
export function PreferencesPage({
  household = false,
}: {
  household?: boolean;
}) {
  const { user } = useAuth();
  const kind = household ? "Household" : "Group";
  return (
    <DomainRecordEditor
      title={`${kind} Settings`}
      sections={[`${kind} Preferences`]}
      endpoint={`/api/${household ? "households" : "groups"}/self`}
      saveEndpoint={`/api/${household ? "households" : "groups"}/preferences`}
      savePath="preferences"
      fields={household ? householdFields : groupFields}
      canEdit={
        !!(
          user?.admin ||
          (household ? user?.canManageHousehold : user?.canManage)
        )
      }
    />
  );
}
export function AdminManagementPage() {
  const { resource = "users", id } = useParams();
  const { user } = useAuth();
  const groups = useApi<PageResult<{ id: string; name: string }>>(
    "/api/admin/groups?perPage=-1",
  );
  if (!["users", "groups", "households"].includes(resource))
    return <Typography>404</Typography>;
  const singular =
    resource === "users"
      ? "User"
      : resource === "groups"
        ? "Group"
        : "Household";
  const endpoint = `/api/admin/${resource}`;
  if (id)
    return (
      <DomainRecordEditor
        key={`${resource}/${id}`}
        title={`Admin ${singular} Management`}
        sections={
          resource === "users"
            ? ["User Details", "Permissions"]
            : [`${singular} Preferences`]
        }
        endpoint={`${endpoint}/${id}`}
        fields={
          resource === "users"
            ? userFields
            : [
                { key: "name", label: "Name", required: true },
                ...(resource === "groups" ? groupFields : householdFields),
              ]
        }
      />
    );
  const fields: Field[] =
    resource === "users"
      ? [
          { key: "email", label: "Email", required: true },
          { key: "fullName", label: "Full Name" },
          { key: "username", label: "User Name" },
        ]
      : [
          { key: "name", label: "Name", required: true },
          ...(resource === "households"
            ? [
                {
                  key: "groupId",
                  label: "Group",
                  required: true,
                  defaultValue: user?.groupId,
                  options:
                    groups.data?.items.map((group) => ({
                      value: group.id,
                      label: group.name,
                    })) ?? [],
                },
              ]
            : []),
        ];
  return (
    <Stack spacing={2}>
      {resource === "users" && (
        <Button component={Link} to="/admin/manage/users/create">
          {tr("Create User")}
        </Button>
      )}
      <DomainEntityTable
        title={`${singular} Management`}
        endpoint={endpoint}
        fields={fields}
        canEdit={resource !== "users"}
        link={(row) => `/admin/manage/${resource}/${row.id}`}
      />
    </Stack>
  );
}
interface Group {
  id: string;
  name: string;
}
interface Household {
  id: string;
  name: string;
  groupId: string;
}
export function AdminCreateUserPage({ setup = false }: { setup?: boolean }) {
  const navigate = useNavigate();
  const groups = useApi<PageResult<Group>>("/api/admin/groups?perPage=-1");
  const households = useApi<PageResult<Household>>(
    "/api/admin/households?perPage=-1",
  );
  const [group, setGroup] = useState<Group | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [fields, setFields] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    admin: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!group || !household) {
      setError("Choose a group and household");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post("/api/admin/users", {
        ...fields,
        group: group.name,
        household: household.name,
      });
      navigate("/admin/manage/users");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack component="form" spacing={2} onSubmit={submit}>
      <Typography component="h1" variant="h4">
        {setup ? "Welcome to Mealie! Let's get started" : "Admin User Creation"}
      </Typography>
      <Typography component="h2" variant="h5">
        {setup ? "Account Details" : "User Details"}
      </Typography>
      {(error || groups.error || households.error) && (
        <Alert severity="error">
          {error || groups.error || households.error}
        </Alert>
      )}
      <Autocomplete
        options={groups.data?.items ?? []}
        value={group}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(item) => item.name}
        onChange={(_, value) => {
          setGroup(value);
          setHousehold(null);
        }}
        renderInput={(params) => (
          <TextField {...params} label={tr("User Group")} required />
        )}
      />
      <Autocomplete
        options={
          households.data?.items.filter((item) => item.groupId === group?.id) ??
          []
        }
        value={household}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(item) => item.name}
        onChange={(_, value) => setHousehold(value)}
        renderInput={(params) => (
          <TextField {...params} label={tr("User Household")} required />
        )}
      />
      {(["username", "fullName", "email", "password"] as const).map((key) => (
        <TextField
          key={key}
          label={
            {
              username: "User Name",
              fullName: "Full Name",
              email: "Email",
              password: "Password",
            }[key]
          }
          type={
            key === "password" ? "password" : key === "email" ? "email" : "text"
          }
          inputProps={key === "password" ? { role: "textbox" } : undefined}
          required
          value={fields[key]}
          onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
        />
      ))}
      <Typography component="h2" variant="h5">
        {tr("Permissions")}
      </Typography>
      <FormControlLabel
        label={tr("Administrator")}
        control={
          <Checkbox
            checked={fields.admin}
            onChange={(e) => setFields({ ...fields, admin: e.target.checked })}
          />
        }
      />
      <Button type="submit" disabled={busy}>
        {tr("Create")}
      </Button>
    </Stack>
  );
}
export function HouseholdMembersPage() {
  return (
    <DomainEntityTable
      title={tr("Manage Members")}
      endpoint="/api/households/members"
      canEdit={false}
      fields={[
        { key: "fullName", label: "Full Name" },
        { key: "email", label: "Email" },
      ]}
    />
  );
}
export function IntegrationsPage() {
  const { integration = "webhooks" } = useParams();
  const { user } = useAuth();
  const webhook = integration === "webhooks";
  return (
    <DomainEntityTable
      title={webhook ? "Webhooks" : "Event Notifiers"}
      endpoint={
        webhook
          ? "/api/households/webhooks"
          : "/api/households/events/notifications"
      }
      canEdit={!!(user?.admin || user?.canManageHousehold)}
      fields={[
        { key: "name", label: "Name", required: true },
        ...(webhook
          ? [
              { key: "url", label: "URL", required: true },
              {
                key: "scheduledTime",
                label: "Scheduled Time",
                defaultValue: "12:00",
                required: true,
              },
              { key: "webhookType", label: "Type", defaultValue: "mealplan" },
              { key: "enabled", label: "Enabled", type: "boolean" as const },
            ]
          : [{ key: "appriseUrl", label: "Notification URL", required: true }]),
      ]}
    />
  );
}

export function AdminSetupPage() {
  const { user } = useAuth();
  return (
    <Stack spacing={2}>
      {user && (
        <DomainRecordEditor
          title={tr("Welcome to Mealie! Let's get started")}
          sections={["Account Details"]}
          endpoint={`/api/admin/users/${user.id}`}
          fields={userFields}
        />
      )}
      <Button component={Link} to="/user/profile/edit">
        {tr("Change Password")}
      </Button>
      <Button component={Link} to="/group">
        {tr("Group Settings")}
      </Button>
      <Button component={Link} to="/household">
        {tr("Household Settings")}
      </Button>
    </Stack>
  );
}
