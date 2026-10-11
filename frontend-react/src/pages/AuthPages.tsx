import { text as tr } from "../i18n";
import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import type {
  AppInfo,
  AppStartupInfo,
} from "../../../frontend/app/lib/api/types/admin";
import { useAuth } from "../auth/AuthProvider";
import { useApi } from "../hooks/useApi";
import { api, ApiError, errorMessage, request } from "../lib/api/http";
import { isSafeRedirectTarget } from "../lib/validators/redirect";

export function LoginPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: info } = useApi<AppInfo>("/api/app/about");
  const { data: startup } = useApi<AppStartupInfo>(
    "/api/app/about/startup-info",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [callbackHandled, setCallbackHandled] = useState(false);
  const redirect =
    params.get("redirect") ?? sessionStorage.getItem("pwa_share_redirect");
  useEffect(() => {
    if (auth.user) {
      sessionStorage.removeItem("pwa_share_redirect");
      navigate(
        isSafeRedirectTarget(redirect) ? redirect : `/g/${auth.user.groupSlug}`,
        { replace: true },
      );
    }
  }, [auth.user, navigate, redirect]);
  useEffect(() => {
    if (startup?.isFirstLogin) {
      setUsername("changeme@example.com");
      setPassword("MyPassword");
    }
  }, [startup]);
  useEffect(() => {
    if (
      info?.enableOidc &&
      !callbackHandled &&
      (params.has("code") || params.has("error"))
    ) {
      setCallbackHandled(true);
      request(`/api/auth/oauth/callback?${params.toString()}`)
        .then(() => auth.reload())
        .catch((reason: unknown) => setError(errorMessage(reason)));
    } else if (
      info?.enableOidc &&
      info.oidcRedirect &&
      !params.has("direct") &&
      !params.has("code") &&
      !params.has("error")
    ) {
      if (isSafeRedirectTarget(redirect))
        sessionStorage.setItem("pwa_share_redirect", redirect);
      window.location.assign("/api/auth/oauth");
    }
  }, [info, params, callbackHandled, auth, redirect]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await auth.login(username, password, remember);
    } catch (reason) {
      setError(
        reason instanceof ApiError && reason.status === 401
          ? t("user.invalid-credentials")
          : errorMessage(reason),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Paper sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Stack spacing={2} component="form" onSubmit={submit}>
        <Typography variant="h4" component="h1">
          {t("user.sign-in")}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {info?.allowPasswordLogin !== false && (
          <>
            <TextField
              required
              label={t("user.email-or-username")}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              required
              label={t("user.password")}
              type={show ? "text" : "password"}
              inputProps={{ role: "textbox" }}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={show}
                  onChange={(e) => setShow(e.target.checked)}
                />
              }
              label={tr("Show password")}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
              }
              label={t("user.remember-me")}
            />
            <Button type="submit" variant="contained" disabled={busy}>
              {t("user.login")}
            </Button>
            <Button component={Link} to="/forgot-password">
              {t("user.reset-password")}
            </Button>
            {info?.allowSignup && (
              <Button component={Link} to="/register">
                {t("user.register")}
              </Button>
            )}
          </>
        )}
        {info?.enableOidc && (
          <Button href="/api/auth/oauth">
            {t("user.login-oidc")} {info.oidcProviderName}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

export function PasswordPage({ reset = false }: { reset?: boolean }) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const token = params.get("token") ?? "";
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (reset && password !== confirm) {
      setError(t("user.password-must-match"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post(
        reset ? "/api/users/reset-password" : "/api/users/forgot-password",
        reset
          ? { email, password, passwordConfirm: confirm, token }
          : { email },
      );
      navigate("/login");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Paper sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Stack component="form" onSubmit={submit} spacing={2}>
        <Typography component="h1" variant="h4">
          {t(reset ? "user.reset-password" : "user.forgot-password")}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label={t("user.email")}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {reset && (
          <>
            <TextField
              label={t("user.password")}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label={t("user.confirm-password")}
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </>
        )}
        <Button type="submit" disabled={busy || (reset && !token)}>
          {reset && !token ? "Token Required" : t("user.reset-password")}
        </Button>
        <Button component={Link} to="/login">
          {t("user.login")}
        </Button>
      </Stack>
    </Paper>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"join" | "create" | null>(
    params.has("token") ? "join" : null,
  );
  const [fields, setFields] = useState({
    group: "",
    groupToken: params.get("token") ?? "",
    email: "",
    fullName: "",
    username: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const info = useApi<AppInfo>("/api/app/about");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (fields.password !== fields.passwordConfirm) {
      setError(t("user.password-must-match"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { group, groupToken, ...account } = fields;
      await api.post("/api/users/register", {
        ...account,
        ...(mode === "join" ? { groupToken } : { group }),
        locale: "en-US",
        private: true,
        seedData: false,
      });
      navigate("/login");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  const labels: Record<keyof typeof fields, string> = {
    group: "Group Name",
    groupToken: "Group Token",
    email: t("user.email"),
    fullName: t("user.full-name"),
    username: t("user.username"),
    password: t("user.password"),
    passwordConfirm: t("user.confirm-password"),
  };
  return (
    <Paper sx={{ maxWidth: 650, mx: "auto", p: 3 }}>
      <Stack spacing={2} component="form" onSubmit={submit}>
        <Typography component="h1" variant="h4">
          {tr("User Registration")}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Button onClick={() => setMode("join")}>{tr("Join a Group")}</Button>
        <Button
          onClick={() => setMode("create")}
          disabled={info.data?.allowSignup === false}
        >
          {tr("Create a New Group")}
        </Button>
        {mode && (
          <>
            {(Object.keys(fields) as (keyof typeof fields)[])
              .filter(
                (key) => key !== (mode === "join" ? "group" : "groupToken"),
              )
              .map((key) => (
                <TextField
                  key={key}
                  label={labels[key]}
                  required
                  type={
                    key.startsWith("password")
                      ? "password"
                      : key === "email"
                        ? "email"
                        : "text"
                  }
                  value={fields[key]}
                  onChange={(e) =>
                    setFields({ ...fields, [key]: e.target.value })
                  }
                />
              ))}
            <Button type="submit" disabled={busy}>
              {tr("Register")}
            </Button>
          </>
        )}
        <Button component={Link} to="/login">
          {t("user.login")}
        </Button>
      </Stack>
    </Paper>
  );
}
