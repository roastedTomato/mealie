import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";
import { put, post, remove, errorMessage, useResource } from "../../shared/api";
import type { UserOut, LongLiveTokenOut } from "../../shared/types";
import { PageTitle, Section, NavLinks, ResourceStatus } from "../../shared/ui";
import { useText } from "../../shared/useText";
export function ProfilePage() {
  const { user } = useAuth();
  const t = useText();
  return (
    <>
      <PageTitle>{`Welcome, ${user?.fullName ?? user?.username}!`}</PageTitle>
      <Section title={t("Account Summary")}>
        <Typography>{user?.email}</Typography>
        <Typography>
          {user?.group} / {user?.household}
        </Typography>
      </Section>
      <NavLinks
        links={[
          [t("User Settings"), "/user/profile/edit"],
          [t("API Tokens"), "/user/profile/api-tokens"],
        ]}
      />
    </>
  );
}
export function ProfileEditPage() {
  const { user, refresh } = useAuth();
  const t = useText();
  const [values, setValues] = useState({
    email: user?.email ?? "",
    username: user?.username ?? "",
    fullName: user?.fullName ?? "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  useEffect(() => {
    if (user)
      setValues({
        email: user.email,
        username: user.username ?? "",
        fullName: user.fullName ?? "",
      });
  }, [user]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      await put<UserOut>(`/api/users/${user.id}`, { ...user, ...values });
      await refresh();
      setMessage("Updated");
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <>
      <PageTitle>{t("User Settings")}</PageTitle>
      <Section title={t("Personal Information")}>
        <Stack component="form" onSubmit={submit} spacing={2} maxWidth={600}>
          {Object.entries(values).map(([key, value]) => (
            <TextField
              key={key}
              label={t(
                {
                  email: "Email",
                  username: "User Name",
                  fullName: "Full Name",
                }[key as keyof typeof values],
              )}
              value={value}
              required
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            />
          ))}
          <Button type="submit">{t("Update")}</Button>
        </Stack>
      </Section>
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert>{message}</Alert>}
      <Section title={t("Change Password")}>
        <Stack spacing={2} maxWidth={600}>
          <TextField
            label={t("Current Password")}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            label={t("New Password")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            onClick={() =>
              void put("/api/users/password", { currentPassword, newPassword })
                .then(() => setMessage("Password changed"))
                .catch((e: unknown) => setError(errorMessage(e)))
            }
          >
            {t("Change Password")}
          </Button>
        </Stack>
      </Section>
    </>
  );
}
export function TokensPage() {
  const t = useText();
  const resource = useResource<UserOut>("/api/users/self");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <PageTitle>{t("API Tokens")}</PageTitle>
      <ResourceStatus
        loading={resource.loading}
        error={resource.error || error}
      />
      <Section title={t("Create an API Token")}>
        <Stack direction="row" spacing={2}>
          <TextField
            label={t("Name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            disabled={!name.trim()}
            onClick={() =>
              void post<LongLiveTokenOut & { token: string }>(
                "/api/users/api-tokens",
                { name },
              )
                .then((x) => {
                  setToken(x.token);
                  setName("");
                  resource.reload();
                })
                .catch((e: unknown) => setError(errorMessage(e)))
            }
          >
            {t("Create")}
          </Button>
        </Stack>
        {token && <Alert severity="info">{token}</Alert>}
      </Section>
      {resource.data?.tokens?.map((x) => (
        <Stack key={x.id} direction="row">
          <Typography>{x.name}</Typography>
          <Button
            onClick={() =>
              void remove(`/api/users/api-tokens/${x.id}`)
                .then(resource.reload)
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
