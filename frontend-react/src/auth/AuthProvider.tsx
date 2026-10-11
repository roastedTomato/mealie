import { text as tr } from "../i18n";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Alert, CircularProgress } from "@mui/material";
import type { UserOut } from "../../../frontend/app/lib/api/types/user";
import {
  api,
  clearSessionCookie,
  errorMessage,
  refreshToken,
  request,
  TOKEN_NAME,
} from "../lib/api/http";
import { getTokenExpiry, nextRefreshDelay, readTokenCookie } from "./token";
interface AuthState {
  user: UserOut | null;
  loading: boolean;
  error: string | null;
  login: (
    username: string,
    password: string,
    remember: boolean,
  ) => Promise<UserOut>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
}
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setError(null);
    try {
      setUser(
        readTokenCookie(TOKEN_NAME)
          ? await api.get<UserOut>("/api/users/self")
          : null,
      );
    } catch (reason) {
      setUser(null);
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    let stopped = false;
    const schedule = () => {
      clearTimeout(timer);
      const token = readTokenCookie(TOKEN_NAME);
      if (!token) {
        setUser(null);
        return;
      }
      const expiry = getTokenExpiry(token);
      const delay =
        expiry === null ? null : nextRefreshDelay(expiry - Date.now());
      if (delay !== null)
        timer = setTimeout(() => {
          void renew();
        }, delay);
    };
    const renew = async () => {
      try {
        await refreshToken();
        retries = 0;
        if (!stopped) schedule();
      } catch {
        if (!stopped && readTokenCookie(TOKEN_NAME) && retries < 5)
          timer = setTimeout(() => {
            void renew();
          }, ++retries * 60_000);
      }
    };
    const reset = () => {
      clearTimeout(timer);
      setUser(null);
      setError(null);
    };
    const onFocus = () => {
      retries = 0;
      schedule();
    };
    const visibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("mealie-session")
        : null;
    if (channel)
      channel.onmessage = (event) => {
        if (event.data === "logout") reset();
      };
    window.addEventListener("mealie:logout", reset);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    document.addEventListener("visibilitychange", visibility);
    if (user) schedule();
    return () => {
      stopped = true;
      clearTimeout(timer);
      channel?.close();
      window.removeEventListener("mealie:logout", reset);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [user]);
  async function login(username: string, password: string, remember: boolean) {
    const form = new FormData();
    form.set("username", username);
    form.set("password", password);
    form.set("remember_me", String(remember));
    await request("/api/auth/token", { method: "POST", body: form }, false);
    const value = await api.get<UserOut>("/api/users/self");
    setUser(value);
    setError(null);
    return value;
  }
  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* Local logout still succeeds if the server is unavailable. */
    } finally {
      clearSessionCookie();
      setUser(null);
    }
  }
  return (
    <Context.Provider value={{ user, loading, error, login, logout, reload }}>
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
export function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { user, loading, error, reload } = useAuth();
  const location = useLocation();
  if (loading) return <CircularProgress aria-label={tr("Loading session")} />;
  if (!user && error && readTokenCookie(TOKEN_NAME))
    return (
      <Alert
        severity="error"
        onClose={() => {
          void reload();
        }}
      >
        {error}
      </Alert>
    );
  if (!user)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (admin && !user.admin)
    return <Alert severity="error">{tr("Access denied")}</Alert>;
  return <Outlet />;
}
