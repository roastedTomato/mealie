import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useText } from "./useText";
import { errorMessage } from "./api";
import { Link, Outlet, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthProvider";
import { changeLanguage, languages } from "./i18n";
import { NavLinks } from "./ui";
export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const t = useText();
  const [error, setError] = useState("");
  const { i18n } = useTranslation();
  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
          <Typography component={Link} to="/" color="inherit" variant="h6">
            Mealie
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {user && (
            <>
              <Typography>{user.fullName}</Typography>
              <Button color="inherit" component={Link} to="/user/profile">
                {t("Profile")}
              </Button>
              <Button
                color="inherit"
                onClick={() => void logout().finally(() => navigate("/login"))}
              >
                {t("Logout")}
              </Button>
            </>
          )}
          <Select
            size="small"
            aria-label="Language"
            value={i18n.language}
            onChange={(e) =>
              void changeLanguage(e.target.value).catch((error: unknown) =>
                setError(errorMessage(error)),
              )
            }
            sx={{ bgcolor: "background.paper" }}
          >
            {languages.map((x) => (
              <MenuItem key={x} value={x}>
                {x}
              </MenuItem>
            ))}
          </Select>
        </Toolbar>
      </AppBar>
      {user && (
        <Box sx={{ px: 3, pt: 2 }}>
          <NavLinks
            links={[
              ["Recipes", `/g/${user.groupSlug}`],
              ["Shopping Lists", "/shopping-lists"],
              ["Meal Planner", "/household/mealplan/planner"],
              ["Settings", "/household"],
              ["Group Settings", "/group"],
              ...(user.admin
                ? ([
                    ["Site Settings", "/admin/site-settings"],
                    ["User Management", "/admin/manage/users"],
                  ] as Array<[string, string]>)
                : []),
            ].map(
              ([label, path]) =>
                [t(label ?? ""), path ?? "/"] as [string, string],
            )}
          />
        </Box>
      )}
      <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Outlet />
      </Container>
    </>
  );
}
