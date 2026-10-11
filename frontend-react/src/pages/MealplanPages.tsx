import { text as tr } from "../i18n";
import { useState, type FormEvent } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useParams } from "react-router";
import type {
  ReadPlanEntry,
  PlanEntryType,
} from "../../../frontend/app/lib/api/types/meal-plan";
import type { Recipe } from "../../../frontend/app/lib/api/types/recipe";
import { useApi } from "../hooks/useApi";
import { api, errorMessage, type PageResult } from "../lib/api/http";
import { weekDates, offsetDate, dayLabel } from "../lib/mealplan/dates";
import { useAuth } from "../auth/AuthProvider";
import { DomainEntityTable } from "../components/DomainEntityTable";
const types: PlanEntryType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "side",
  "snack",
  "drink",
  "dessert",
];
export function MealplanPage() {
  const { user } = useAuth();
  const { mode = "view" } = useParams();
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const dates = weekDates(start);
  const entries = useApi<PageResult<ReadPlanEntry>>(
    `/api/households/mealplans?perPage=-1&start_date=${start}&end_date=${offsetDate(start, 6)}`,
  );
  const recipes = useApi<PageResult<Recipe>>("/api/recipes?perPage=-1");
  const [target, setTarget] = useState<{
    date: string;
    entry?: ReadPlanEntry;
  } | null>(null);
  const [note, setNote] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [type, setType] = useState<PlanEntryType>("dinner");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function open(date: string, entry?: ReadPlanEntry) {
    setTarget({ date, entry });
    setTitle(entry?.title ?? "");
    setText(entry?.text ?? "");
    setType(entry?.entryType ?? "dinner");
    setNote(!!entry && !entry.recipeId);
    setRecipe(
      recipes.data?.items.find((recipe) => recipe.id === entry?.recipeId) ??
        null,
    );
    setError("");
  }
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      entries.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!target || (!note && !recipe)) {
      setError("Choose a recipe or add a note");
      return;
    }
    await act(async () => {
      const payload = {
        date: target.date,
        entryType: type,
        title: note ? title : "",
        text,
        recipeId: note ? null : recipe?.id,
      };
      if (target.entry)
        await api.put(`/api/households/mealplans/${target.entry.id}`, {
          ...target.entry,
          ...payload,
        });
      else await api.post("/api/households/mealplans", payload);
      setTarget(null);
    });
  }
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Meal Planner")}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button onClick={() => setStart(offsetDate(start, -7))}>
          {tr("Previous Week")}
        </Button>
        <TextField
          label={tr("Start Date")}
          type="date"
          value={start}
          onChange={(e) => {
            if (e.target.value) setStart(e.target.value);
          }}
        />
        <Button onClick={() => setStart(offsetDate(start, 7))}>
          {tr("Next Week")}
        </Button>
        <Button
          component={Link}
          to={`/household/mealplan/planner/${mode === "edit" ? "view" : "edit"}`}
        >
          {mode === "edit" ? "View" : "Edit"}
        </Button>
        <Button component={Link} to="/household/mealplan/settings">
          {tr("Meal Plan Rules")}
        </Button>
      </Stack>
      {(entries.error || error) && (
        <Alert severity="error">{error || entries.error}</Alert>
      )}
      {dates.map((date) => (
        <Paper key={date} sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography component="h2" variant="h5">
              {dayLabel(date)}
            </Typography>
            {mode === "edit" && (
              <Stack direction="row">
                <Button onClick={() => open(date)}>{tr("New")}</Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    void act(async () => {
                      await api.post("/api/households/mealplans/random", {
                        date,
                        entryType: "dinner",
                      });
                    });
                  }}
                >
                  {tr("Random")}
                </Button>
              </Stack>
            )}
          </Stack>
          {entries.data?.items
            .filter((entry) => entry.date === date)
            .map((entry) => (
              <Stack
                key={entry.id}
                direction="row"
                alignItems="center"
                spacing={1}
              >
                <Typography>{entry.entryType}</Typography>
                {entry.recipe ? (
                  <Button
                    component={Link}
                    to={`/g/${user?.groupSlug}/r/${entry.recipe.slug}`}
                  >
                    {entry.recipe.name}
                  </Button>
                ) : (
                  <Typography>{entry.title}</Typography>
                )}
                <Typography>{entry.text}</Typography>
                {mode === "edit" && (
                  <>
                    <Button onClick={() => open(date, entry)}>
                      {tr("Edit")}
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("Delete this meal?"))
                          void act(async () => {
                            await api.delete(
                              `/api/households/mealplans/${entry.id}`,
                            );
                          });
                      }}
                    >
                      {tr("Delete")}
                    </Button>
                  </>
                )}
              </Stack>
            ))}
        </Paper>
      ))}
      <Dialog open={!!target} onClose={() => setTarget(null)} fullWidth>
        <DialogTitle>
          {target?.entry ? "Edit Meal Plan" : "Create a New Meal Plan"}
        </DialogTitle>
        <form onSubmit={save}>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <Stack direction="row">
                <Button onClick={() => setNote(false)}>{tr("Recipe")}</Button>
                <Button onClick={() => setNote(true)}>{tr("Note")}</Button>
              </Stack>
              <TextField
                select
                label={tr("Meal Type")}
                value={type}
                onChange={(e) => setType(e.target.value as PlanEntryType)}
              >
                {types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
              {note ? (
                <TextField
                  label={tr("Meal Title")}
                  value={title}
                  required
                  onChange={(e) => setTitle(e.target.value)}
                />
              ) : (
                <Autocomplete
                  options={recipes.data?.items ?? []}
                  value={recipe}
                  getOptionLabel={(recipe) => recipe.name || ""}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  onChange={(_, value) => setRecipe(value)}
                  renderInput={(params) => (
                    <TextField {...params} label={tr("Recipe")} />
                  )}
                />
              )}
              <TextField
                label={tr("Notes")}
                multiline
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTarget(null)}>{tr("Cancel")}</Button>
            <Button type="submit" disabled={busy}>
              {tr("Save")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
export function MealplanSettingsPage() {
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Meal Plan Rules")}
      </Typography>
      <Typography>{tr("New Rule")}</Typography>
      <DomainEntityTable
        title={tr("Recipe Rules")}
        endpoint="/api/households/mealplans/rules"
        fields={[
          {
            key: "day",
            label: "Day",
            defaultValue: "unset",
            options: [
              "unset",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ].map((value) => ({ value, label: value })),
          },
          {
            key: "entryType",
            label: "Meal Type",
            defaultValue: "unset",
            options: ["unset", ...types].map((value) => ({
              value,
              label: value,
            })),
          },
          { key: "queryFilterString", label: "Recipe Filter" },
        ]}
      />
    </Stack>
  );
}
