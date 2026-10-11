import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { RequireAuth } from "../../auth/AuthProvider";
import {
  AdminManagement,
  CreateUser,
  Preferences,
  Members,
} from "./Management";
import { DataPage, Integrations, Migrations, Report } from "./Data";
import {
  SiteSettings,
  Setup,
  Backups,
  Maintenance,
  Parser,
  AiDebug,
} from "./Tools";
import { Organizers } from "../recipes/routes";
export const managementRoutes: RouteObject[] = [
  { path: "group", element: <Preferences /> },
  { path: "group/data", element: <Navigate to="/group/data/foods" replace /> },
  ...["categories", "tags", "tools"].map((kind) => ({
    path: `group/data/${kind}`,
    element: <Organizers kind={kind} manage />,
  })),
  { path: "group/data/:dataset", element: <DataPage /> },
  { path: "group/migrations", element: <Migrations /> },
  { path: "group/reports/:id", element: <Report /> },
  { path: "household", element: <Preferences household /> },
  { path: "household/members", element: <Members /> },
  { path: "household/:integration", element: <Integrations /> },
  {
    element: <RequireAuth admin />,
    children: [
      { path: "admin", element: <SiteSettings /> },
      { path: "admin/site-settings", element: <SiteSettings /> },
      { path: "admin/setup", element: <Setup /> },
      { path: "admin/manage/users/create", element: <CreateUser /> },
      { path: "admin/manage/:resource", element: <AdminManagement /> },
      { path: "admin/manage/:resource/:id", element: <AdminManagement /> },
      { path: "admin/backups", element: <Backups /> },
      { path: "admin/maintenance", element: <Maintenance /> },
      { path: "admin/debug/parser", element: <Parser /> },
      { path: "admin/debug/openai", element: <AiDebug /> },
      { path: "admin/debug/ai-providers", element: <AiDebug /> },
    ],
  },
];
