import type { RouteObject } from "react-router";
import { LoginPage, PasswordPage, RegisterPage } from "./AuthPages";
import { ProfilePage, ProfileEditPage, TokensPage } from "./ProfilePages";
export const accountPublicRoutes: RouteObject[] = [
  { path: "login", element: <LoginPage /> },
  { path: "forgot-password", element: <PasswordPage /> },
  { path: "reset-password", element: <PasswordPage reset /> },
  { path: "register", element: <RegisterPage /> },
];
export const accountRoutes: RouteObject[] = [
  { path: "user/profile", element: <ProfilePage /> },
  { path: "user/profile/edit", element: <ProfileEditPage /> },
  { path: "user/profile/api-tokens", element: <TokensPage /> },
];
