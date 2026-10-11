import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { Link } from "react-router";
export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
      {children}
    </Typography>
  );
}
export function ResourceStatus({
  loading,
  error,
}: {
  loading: boolean;
  error: string;
}) {
  return (
    <>
      {loading && <CircularProgress aria-label="Loading" />}
      {error && <Alert severity="error">{error}</Alert>}
    </>
  );
}
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
export function NavLinks({ links }: { links: Array<[string, string]> }) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
      {links.map(([label, to]) => (
        <Button key={to} component={Link} to={to}>
          {label}
        </Button>
      ))}
    </Stack>
  );
}
