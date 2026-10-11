import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
} from "@mui/material";
import { I18nextProvider, useTranslation } from "react-i18next";
import { Navigate, Route, Routes } from "react-router";
import i18n from "./i18n";
import { AppLayout } from "./components/Layout/AppLayout";
import { AuthProvider, RequireAuth, useAuth } from "./auth/AuthProvider";
import { LoginPage, PasswordPage, RegisterPage } from "./pages/AuthPages";
import { RecipeListPage } from "./pages/RecipeListPage";
import {
  PreferencesPage,
  AdminManagementPage,
  AdminCreateUserPage,
  AdminSetupPage,
  HouseholdMembersPage,
  IntegrationsPage,
} from "./pages/ManagementPages";
import { DataPage, ReportPage, MigrationsPage } from "./pages/DataPages";
import {
  BackupsPage,
  MaintenancePage,
  ParserDebugPage,
  AiDebugPage,
} from "./pages/AdminToolsPages";
import {
  ProfilePage,
  ProfileEditPage,
  ApiTokensPage,
  FavoritesPage,
} from "./pages/ProfilePages";
import { ShoppingListsPage, ShoppingDetailPage } from "./pages/ShoppingPages";
import { MealplanPage, MealplanSettingsPage } from "./pages/MealplanPages";
import {
  OrganizerPage,
  CookbooksPage,
  FinderPage,
  TimelinePage,
} from "./pages/OrganizerPages";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { RecipeCreatePage } from "./pages/RecipeCreatePage";
import { useParams } from "react-router";
import { SiteSettingsPage } from "./pages/SiteSettingsPage";
const theme = createTheme({ palette: { primary: { main: "#e58325" } } });
function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? `/g/${user.groupSlug}` : "/login"} replace />;
}
function CreateIndex() {
  const { groupSlug } = useParams();
  return <Navigate to={`/g/${groupSlug}/r/create/url`} replace />;
}
function ImageRedirect() {
  const { groupSlug } = useParams();
  return <Navigate to={`/g/${groupSlug}/r/create/ai`} replace />;
}
export function App() {
  const { i18n: language } = useTranslation();
  const localizedTheme = createTheme({ ...theme, direction: language.dir() });
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={localizedTheme}>
        <CssBaseline />
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="forgot-password" element={<PasswordPage />} />
              <Route
                path="g/:groupSlug/shared/r/:id"
                element={<RecipeDetailPage shared />}
              />
              <Route path="reset-password" element={<PasswordPage reset />} />
              <Route path="register" element={<RegisterPage />} />
              <Route element={<RequireAuth />}>
                <Route index element={<Home />} />
                <Route path="g/:groupSlug" element={<RecipeListPage />} />
                <Route path="user/profile" element={<ProfilePage />} />
                <Route path="user/profile/edit" element={<ProfileEditPage />} />
                <Route
                  path="user/profile/api-tokens"
                  element={<ApiTokensPage />}
                />
                <Route path="user/:id/favorites" element={<FavoritesPage />} />
                <Route path="shopping-lists" element={<ShoppingListsPage />} />
                <Route
                  path="shopping-lists/:id"
                  element={<ShoppingDetailPage />}
                />
                <Route
                  path="household/mealplan/planner"
                  element={<MealplanPage />}
                />
                <Route
                  path="household/mealplan/planner/:mode"
                  element={<MealplanPage />}
                />
                <Route
                  path="household/mealplan/settings"
                  element={<MealplanSettingsPage />}
                />
                <Route
                  path="g/:groupSlug/cookbooks"
                  element={<CookbooksPage />}
                />
                <Route
                  path="g/:groupSlug/cookbooks/:slug"
                  element={<CookbooksPage />}
                />
                <Route
                  path="g/:groupSlug/recipes/finder"
                  element={<FinderPage />}
                />
                <Route
                  path="g/:groupSlug/recipes/timeline"
                  element={<TimelinePage />}
                />
                <Route
                  path="g/:groupSlug/recipes/:organizer"
                  element={<OrganizerPage />}
                />
                <Route
                  path="group/data"
                  element={<Navigate to="/group/data/foods" replace />}
                />
                <Route path="group/data/:dataset" element={<DataPage />} />
                <Route path="group" element={<PreferencesPage />} />
                <Route path="group/migrations" element={<MigrationsPage />} />
                <Route path="group/reports/:id" element={<ReportPage />} />
                <Route
                  path="household"
                  element={<PreferencesPage household />}
                />
                <Route
                  path="household/members"
                  element={<HouseholdMembersPage />}
                />
                <Route
                  path="household/:integration"
                  element={<IntegrationsPage />}
                />
                <Route path="g/:groupSlug/r/create" element={<CreateIndex />} />
                <Route
                  path="g/:groupSlug/r/create/image"
                  element={<ImageRedirect />}
                />
                <Route
                  path="g/:groupSlug/r/create/:mode"
                  element={<RecipeCreatePage />}
                />
                <Route
                  path="g/:groupSlug/r/:slug"
                  element={<RecipeDetailPage />}
                />
                <Route
                  path="g/:groupSlug/*"
                  element={<Typography component="h1">404</Typography>}
                />
                <Route element={<RequireAuth admin />}>
                  <Route path="admin" element={<SiteSettingsPage />} />
                  <Route
                    path="admin/site-settings"
                    element={<SiteSettingsPage />}
                  />
                  <Route
                    path="admin/manage/users/create"
                    element={<AdminCreateUserPage />}
                  />
                  <Route
                    path="admin/manage/:resource"
                    element={<AdminManagementPage />}
                  />
                  <Route
                    path="admin/manage/:resource/:id"
                    element={<AdminManagementPage />}
                  />
                  <Route path="admin/setup" element={<AdminSetupPage />} />
                  <Route path="admin/backups" element={<BackupsPage />} />
                  <Route
                    path="admin/maintenance"
                    element={<MaintenancePage />}
                  />
                  <Route
                    path="admin/debug/parser"
                    element={<ParserDebugPage />}
                  />
                  <Route path="admin/debug/openai" element={<AiDebugPage />} />
                  <Route
                    path="admin/debug/ai-providers"
                    element={<AiDebugPage />}
                  />
                </Route>
              </Route>
              <Route
                path="*"
                element={
                  <Typography component="h1" variant="h4">
                    404
                  </Typography>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
