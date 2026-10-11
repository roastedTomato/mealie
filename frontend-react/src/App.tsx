import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
} from "@mui/material";
import { I18nextProvider, useTranslation } from "react-i18next";
import { Navigate, useRoutes } from "react-router";
import i18n from "./shared/i18n";
import { AuthProvider, RequireAuth, useAuth } from "./auth/AuthProvider";
import { Layout } from "./shared/Layout";
import { accountRoutes, accountPublicRoutes } from "./features/account/routes";
import { managementRoutes } from "./features/admin/routes";
import { planningRoutes } from "./features/planning/routes";
import { recipeRoutes, recipePublicRoutes } from "./features/recipes/routes";
function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? `/g/${user.groupSlug}` : "/login"} replace />;
}
function Router() {
  return useRoutes([
    {
      element: <Layout />,
      children: [
        ...accountPublicRoutes,
        ...recipePublicRoutes,
        {
          element: <RequireAuth />,
          children: [
            { index: true, element: <Home /> },
            ...accountRoutes,
            ...managementRoutes,
            ...planningRoutes,
            ...recipeRoutes,
          ],
        },
        { path: "*", element: <Typography component="h1">404</Typography> },
      ],
    },
  ]);
}
export function App() {
  const { i18n: language } = useTranslation();
  const theme = createTheme({
    direction: language.dir(),
    palette: { primary: { main: "#bc5824" } },
  });
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
