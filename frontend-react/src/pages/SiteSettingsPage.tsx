import { text as tr } from "../i18n";
import {
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useApi } from "../hooks/useApi";
export function SiteSettingsPage() {
  const config = useApi<Record<string, unknown>>("/api/admin/about");
  const stats = useApi<Record<string, number>>("/api/admin/about/statistics");
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Site Settings")}
      </Typography>
      <Typography component="h2" variant="h5">
        {tr("Configuration")}
      </Typography>
      {config.loading && <CircularProgress />}
      {config.error && <Alert severity="error">{config.error}</Alert>}
      {config.data && (
        <Paper component="dl" sx={{ p: 2 }}>
          {Object.entries(config.data).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>
                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
              </dd>
            </div>
          ))}
        </Paper>
      )}
      <Typography component="h2" variant="h5">
        {tr("Site Statistics")}
      </Typography>
      {stats.error && <Alert severity="error">{stats.error}</Alert>}
      {stats.data && (
        <Paper component="dl" sx={{ p: 2 }}>
          {Object.entries(stats.data).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </Paper>
      )}
    </Stack>
  );
}
