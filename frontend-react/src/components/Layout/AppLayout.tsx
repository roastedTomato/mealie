import { changeLocale, locales, text as tr } from "../../i18n";
import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, Outlet, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";
export function AppLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  async function signOut() {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  }
  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ flexWrap: "wrap", gap: 1 }}>
          <Typography
            component={Link}
            to="/"
            color="inherit"
            sx={{ textDecoration: "none", flexGrow: 1 }}
          >
            {tr("Mealie")}
          </Typography>
          <TextField
            select
            size="small"
            label={tr("Language")}
            value={i18n.resolvedLanguage ?? "en-US"}
            onChange={(e) => {
              void changeLocale(e.target.value);
            }}
            sx={{ minWidth: 160, bgcolor: "background.paper" }}
          >
            {locales.map((locale) => (
              <MenuItem key={locale.value} value={locale.value}>
                {locale.name}
              </MenuItem>
            ))}
          </TextField>
          <Button component={Link} to="/" color="inherit">
            {t("general.home")}
          </Button>
          {user && (
            <>
              <Typography>{user.fullName || user.username}</Typography>
              <Button
                color="inherit"
                onClick={(event) => setAnchor(event.currentTarget)}
              >
                {tr("Settings")}
              </Button>
              <Menu
                anchorEl={anchor}
                open={!!anchor}
                onClose={() => setAnchor(null)}
              >
                {[
                  ["/household", "Household Settings"],
                  ["/group", "Group Settings"],
                  ["/user/profile", "User Profile"],
                  ...(user.admin
                    ? [
                        ["/admin/site-settings", "Site Settings"],
                        ["/admin/manage/users", "User Management"],
                      ]
                    : []),
                ].map(([path, name]) => (
                  <MenuItem
                    key={path}
                    component={Link}
                    to={path ?? "/"}
                    onClick={() => setAnchor(null)}
                  >
                    {tr(name ?? "")}
                  </MenuItem>
                ))}
              </Menu>
              <Button
                color="inherit"
                onClick={() => {
                  void signOut();
                }}
              >
                {tr("Logout")}
              </Button>
            </>
          )}
        </Toolbar>
        {user && (
          <Box
            component="nav"
            aria-label="Main navigation"
            sx={{ display: "flex", flexWrap: "wrap", px: 2 }}
          >
            {[
              [`/g/${user.groupSlug}`, "Recipes"],
              ["/household/mealplan/planner/view", "Meal Planner"],
              ["/shopping-lists", "Shopping Lists"],
              [`/g/${user.groupSlug}/cookbooks`, "Cookbooks"],
              ...["categories", "tags", "tools", "finder", "timeline"].map(
                (kind) => [
                  `/g/${user.groupSlug}/recipes/${kind}`,
                  kind.charAt(0).toUpperCase() + kind.slice(1),
                ],
              ),
            ].map(([path, label]) => (
              <Button
                key={path}
                component={Link}
                to={path ?? "/"}
                color="inherit"
              >
                {tr(label ?? "")}
              </Button>
            ))}
          </Box>
        )}
      </AppBar>
      <Container component="main">
        <Box sx={{ py: 3 }}>
          <Outlet />
        </Box>
      </Container>
    </>
  );
}
