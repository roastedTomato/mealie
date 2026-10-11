import { text as tr } from "../i18n";
import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useParams } from "react-router";
import type {
  LongLiveTokenCreateResponse,
  UserOut,
} from "../../../frontend/app/lib/api/types/user";
import type { Recipe } from "../../../frontend/app/lib/api/types/recipe";
import { useAuth } from "../auth/AuthProvider";
import { useApi } from "../hooks/useApi";
import { api, errorMessage, type PageResult } from "../lib/api/http";
export function ProfilePage() {
  const { user } = useAuth();
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Welcome,")} {user?.fullName}!
      </Typography>
      <Typography component="h2" variant="h5">
        {tr("Account Summary")}
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography>{user?.email}</Typography>
        <Typography>
          {tr("Group:")} {user?.group}
        </Typography>
        <Typography>
          {tr("Household:")} {user?.household}
        </Typography>
      </Paper>
      <Button component={Link} to="/user/profile/edit">
        {tr("User Settings")}
      </Button>
      <Button component={Link} to="/user/profile/api-tokens">
        {tr("API Tokens")}
      </Button>
      <Button component={Link} to={`/user/${user?.id}/favorites`}>
        {tr("User Favorites")}
      </Button>
    </Stack>
  );
}
export function ProfileEditPage() {
  const { user, reload } = useAuth();
  const [draft, setDraft] = useState<UserOut | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  useEffect(() => {
    setDraft(user);
  }, [user]);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await api.put(`/api/users/${draft.id}`, draft);
      await reload();
      setSaved(true);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  async function password(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirm) {
      setError("Passwords must match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.put("/api/users/password", { currentPassword, newPassword });
      setCurrent("");
      setPassword("");
      setConfirm("");
      setSaved(true);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("User Settings")}
      </Typography>
      <Typography component="h2" variant="h5">
        {tr("Personal Information")}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {saved && <Alert severity="success">{tr("Saved")}</Alert>}
      {draft && (
        <Stack component="form" onSubmit={save} spacing={2}>
          <TextField
            label={tr("Email")}
            type="email"
            required
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          />
          <TextField
            label={tr("Full Name")}
            required
            value={draft.fullName ?? ""}
            onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
          />
          <TextField
            label={tr("User Name")}
            required
            value={draft.username ?? ""}
            onChange={(e) => setDraft({ ...draft, username: e.target.value })}
          />
          <Button type="submit" disabled={busy}>
            {tr("Update")}
          </Button>
        </Stack>
      )}
      <Typography component="h2" variant="h5">
        {tr("Change Password")}
      </Typography>
      <Stack component="form" onSubmit={password} spacing={2}>
        <TextField
          label={tr("Current Password")}
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <TextField
          label={tr("New Password")}
          type="password"
          required
          value={newPassword}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label={tr("Confirm Password")}
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {tr("Change Password")}
        </Button>
      </Stack>
    </Stack>
  );
}
export function ApiTokensPage() {
  const { user, reload } = useAuth();
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api.post<LongLiveTokenCreateResponse>(
        "/api/users/api-tokens",
        { name },
      );
      setToken(result.token);
      setName("");
      await reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("API Tokens")}
      </Typography>
      <Typography component="h2" variant="h5">
        {tr("Create an API Token")}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack component="form" onSubmit={create} spacing={1}>
        <TextField
          label={tr("Token Name")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {tr("Create")}
        </Button>
      </Stack>
      {token && (
        <>
          <Alert severity="info">
            {tr("Copy this token now. It is only shown once.")}
          </Alert>
          <TextField
            label={tr("API Token")}
            value={token}
            slotProps={{ input: { readOnly: true } }}
          />
        </>
      )}
      {user?.tokens?.map((item) => (
        <Paper key={item.id} sx={{ p: 2 }}>
          <Typography>{item.name}</Typography>
          <Typography>{item.createdAt}</Typography>
          <Button
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Revoke ${item.name}?`)) {
                setBusy(true);
                void api
                  .delete(`/api/users/api-tokens/${item.id}`)
                  .then(reload)
                  .catch((reason: unknown) => setError(errorMessage(reason)))
                  .finally(() => setBusy(false));
              }
            }}
          >
            {tr("Revoke")}
          </Button>
        </Paper>
      ))}
    </Stack>
  );
}
export function FavoritesPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const ratings = useApi<{ ratings: { recipeId: string }[] }>(
    `/api/users/${id}/favorites`,
  );
  const recipes = useApi<PageResult<Recipe>>("/api/recipes?perPage=-1");
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("User Favorites")}
      </Typography>
      {(ratings.error || recipes.error) && (
        <Alert severity="error">{ratings.error || recipes.error}</Alert>
      )}
      {recipes.data?.items
        .filter((recipe) =>
          ratings.data?.ratings.some((rating) => rating.recipeId === recipe.id),
        )
        .map((recipe) => (
          <Button
            key={recipe.id}
            component={Link}
            to={`/g/${user?.groupSlug}/r/${recipe.slug}`}
          >
            {recipe.name}
          </Button>
        ))}
    </Stack>
  );
}
