import { text as tr } from "../i18n";
import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router";
import { api, errorMessage, type PageResult } from "../lib/api/http";
import { useApi } from "../hooks/useApi";
export interface Entity {
  id: string | number;
  name?: string;
  title?: string;
  [key: string]: unknown;
}
export interface Field {
  key: string;
  label: string;
  type?: "boolean" | "number" | "password" | "email" | "multiline";
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
}
export function DomainEntityTable({
  title,
  endpoint,
  fields = [{ key: "name", label: "Name", required: true }],
  link,
  canEdit = true,
}: {
  title: string;
  endpoint: string;
  fields?: Field[];
  link?: (row: Entity) => string;
  canEdit?: boolean;
}) {
  const state = useApi<PageResult<Entity> | Entity[]>(
    `${endpoint}${endpoint.includes("?") ? "&" : "?"}perPage=-1`,
  );
  const rows = state.data
    ? Array.isArray(state.data)
      ? state.data
      : state.data.items
    : [];
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Entity | "new" | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [deleting, setDeleting] = useState<Entity | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function edit(row: Entity | "new") {
    setError("");
    setEditing(row);
    setDraft(
      row === "new"
        ? Object.fromEntries(
            fields.map((field) => [
              field.key,
              field.defaultValue ?? (field.type === "boolean" ? false : ""),
            ]),
          )
        : { ...row },
    );
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing === "new") await api.post(endpoint, draft);
      else if (editing) await api.put(`${endpoint}/${editing.id}`, draft);
      setEditing(null);
      state.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`${endpoint}/${deleting.id}`);
      setDeleting(null);
      state.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr(title)}
      </Typography>
      {canEdit && <Button onClick={() => edit("new")}>{tr("Create")}</Button>}
      <TextField
        label={tr("Search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {(state.error || error) && (
        <Alert severity="error">{error || state.error}</Alert>
      )}
      {state.loading && <CircularProgress aria-label={`Loading ${title}`} />}
      <Table>
        <TableHead>
          <TableRow>
            {fields
              .filter((field) => field.type !== "password")
              .map((field) => (
                <TableCell key={field.key}>{tr(field.label)}</TableCell>
              ))}
            {canEdit && <TableCell>{tr("Actions")}</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows
            .filter((row) =>
              Object.values(row).some(
                (value) =>
                  typeof value === "string" &&
                  value.toLowerCase().includes(search.toLowerCase()),
              ),
            )
            .map((row) => (
              <TableRow key={row.id}>
                {fields
                  .filter((field) => field.type !== "password")
                  .map((field, index) => (
                    <TableCell key={field.key}>
                      {index === 0 && link ? (
                        <Link to={link(row)}>
                          {String(row[field.key] ?? "")}
                        </Link>
                      ) : typeof row[field.key] === "boolean" ? (
                        row[field.key] ? (
                          "Yes"
                        ) : (
                          "No"
                        )
                      ) : (
                        String(row[field.key] ?? "")
                      )}
                    </TableCell>
                  ))}
                {canEdit && (
                  <TableCell>
                    <Button onClick={() => edit(row)}>{tr("Edit")}</Button>
                    <Button color="error" onClick={() => setDeleting(row)}>
                      {tr("Delete")}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        fullWidth
      >
        <DialogTitle>{editing === "new" ? "Create" : "Edit"}</DialogTitle>
        <form onSubmit={save}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {fields.map((field) =>
                field.type === "boolean" ? (
                  <FormControlLabel
                    key={field.key}
                    label={tr(field.label)}
                    control={
                      <Checkbox
                        checked={!!draft[field.key]}
                        onChange={(e) =>
                          setDraft({ ...draft, [field.key]: e.target.checked })
                        }
                      />
                    }
                  />
                ) : (
                  <TextField
                    key={field.key}
                    label={field.label}
                    required={field.required}
                    type={
                      ["number", "password", "email"].includes(field.type ?? "")
                        ? field.type
                        : "text"
                    }
                    multiline={field.type === "multiline"}
                    select={!!field.options}
                    value={draft[field.key] ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        [field.key]:
                          field.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  >
                    {field.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ),
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>{tr("Cancel")}</Button>
            <Button disabled={busy} type="submit">
              {tr("Save")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>
          {tr("Delete")}
          {deleting?.name || deleting?.title}?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>{tr("Cancel")}</Button>
          <Button
            disabled={busy}
            onClick={() => {
              void remove();
            }}
          >
            {tr("Delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
