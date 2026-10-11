import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { CircularProgress } from "@mui/material";
import type { UserOut } from "../shared/types";
import {
  api,
  get,
  post,
  clearSession,
  setBearer,
  tokenFromCookie,
  errorMessage,
} from "../shared/api";
interface Auth {
  user: UserOut | null;
  loading: boolean;
  error: string;
  login: (
    username: string,
    password: string,
    remember: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    setUser(await get<UserOut>("/api/users/self"));
  }
  useEffect(() => {
    let active = true;
    const clear = () => setUser(null);
    window.addEventListener("mealie:logout", clear);
    if (!tokenFromCookie()) {
      setLoading(false);
    } else {
      get<UserOut>("/api/users/self")
        .then((x) => {
          if (active) setUser(x);
        })
        .catch((e: unknown) => {
          if (active) setError(errorMessage(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
      window.removeEventListener("mealie:logout", clear);
    };
  }, []);
  async function login(username: string, password: string, remember: boolean) {
    const body = new URLSearchParams({
      username,
      password,
      remember_me: String(remember),
    });
    const x = await api<{ access_token: string }>("/api/auth/token", {
      method: "POST",
      body,
    });
    setBearer(x.access_token);
    await refresh();
    setError("");
  }
  async function logout() {
    try {
      await post("/api/auth/logout");
    } finally {
      clearSession();
      setUser(null);
      setError("");
    }
  }
  return (
    <Context.Provider value={{ user, loading, error, login, logout, refresh }}>
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider required");
  return value;
}
export function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { user, loading, error } = useAuth();
  const location = useLocation();
  if (loading) return <CircularProgress aria-label="Loading session" />;
  if (error && !user) return <Navigate to="/login" replace />;
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && !user.admin) return <Navigate to="/" replace />;
  return <Outlet />;
}
