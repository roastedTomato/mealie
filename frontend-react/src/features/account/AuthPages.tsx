import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../auth/AuthProvider";
import { post, errorMessage } from "../../shared/api";
import { PageTitle } from "../../shared/ui";
import { useText } from "../../shared/useText";
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const t = useText();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password, remember);
      navigate("/", { replace: true });
    } catch (err) {
      setError(`Invalid credentials: ${errorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack component="form" onSubmit={submit} spacing={2} maxWidth={480}>
      <PageTitle>{t("Sign in")}</PageTitle>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label={t("Email or Username")}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="username"
      />
      <TextField
        label={t("Password")}
        type="password"
        slotProps={{ htmlInput: { role: "textbox" } }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <FormControlLabel
        label={t("Remember Me")}
        control={
          <Checkbox checked={remember} onChange={(_, x) => setRemember(x)} />
        }
      />
      <Button type="submit" variant="contained" disabled={busy}>
        {t("Login")}
      </Button>
      <Button component={Link} to="/forgot-password">
        {t("Forgot Password")}
      </Button>
      <Button component={Link} to="/register">
        {t("User Registration")}
      </Button>
    </Stack>
  );
}
export function PasswordPage({ reset = false }: { reset?: boolean }) {
  const t = useText();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (reset && password !== confirm) {
      setError("Passwords must match");
      return;
    }
    try {
      await post(
        reset ? "/api/users/reset-password" : "/api/users/forgot-password",
        reset
          ? { token, email, password, passwordConfirm: confirm }
          : { email },
      );
      setMessage(
        reset
          ? "Password updated"
          : "Check your email for further instructions",
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <Stack component="form" spacing={2} maxWidth={480} onSubmit={submit}>
      <PageTitle>{t(reset ? "Reset Password" : "Forgot Password")}</PageTitle>
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert>{message}</Alert>}
      <TextField
        required
        label={t("Email")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {reset && (
        <>
          <TextField
            required
            label={t("Reset Token")}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <TextField
            required
            label={t("New Password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            required
            label={t("Confirm Password")}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </>
      )}
      <Button type="submit">{t("Submit")}</Button>
      <Button component={Link} to="/login">
        {t("Login")}
      </Button>
    </Stack>
  );
}
export function RegisterPage() {
  const t = useText();
  const [mode, setMode] = useState("join");
  const [values, setValues] = useState({
    email: "",
    username: "",
    fullName: "",
    password: "",
    passwordConfirm: "",
    group: "",
    groupToken: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (values.password !== values.passwordConfirm) {
      setError("Passwords must match");
      return;
    }
    try {
      await post("/api/users/register", {
        ...values,
        group: mode === "create" ? values.group : null,
        groupToken: mode === "join" ? values.groupToken : null,
      });
      setMessage("Account created. You can sign in.");
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <Stack component="form" onSubmit={submit} spacing={2} maxWidth={600}>
      <PageTitle>{t("User Registration")}</PageTitle>
      <ToggleButtonGroup
        exclusive
        value={mode}
        onChange={(_, x: string | null) => {
          if (x) setMode(x);
        }}
      >
        <ToggleButton value="join">{t("Join a Group")}</ToggleButton>
        <ToggleButton value="create">{t("Create a New Group")}</ToggleButton>
      </ToggleButtonGroup>
      {Object.entries(values)
        .filter(([k]) => k !== (mode === "join" ? "group" : "groupToken"))
        .map(([k, v]) => (
          <TextField
            key={k}
            label={t(
              {
                email: "Email",
                username: "User Name",
                fullName: "Full Name",
                password: "Password",
                passwordConfirm: "Confirm Password",
                group: "Group Name",
                groupToken: "Group Token",
              }[k as keyof typeof values],
            )}
            required
            value={v}
            type={k.includes("password") ? "password" : "text"}
            onChange={(e) => setValues({ ...values, [k]: e.target.value })}
          />
        ))}
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert>{message}</Alert>}
      <Button type="submit">{t("Register")}</Button>
    </Stack>
  );
}
