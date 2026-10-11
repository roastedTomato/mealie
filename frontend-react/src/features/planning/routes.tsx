import { usePlanningText } from "./i18n";
import { useState } from "react";
import { Link, Navigate, useParams, type RouteObject } from "react-router";
import {
  Autocomplete,
  Button,
  Checkbox,
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
import { useTranslation } from "react-i18next";
import {
  errorMessage,
  post,
  put,
  remove,
  useResource,
  type Page,
} from "../../shared/api";
import { ResourceStatus } from "../../shared/ui";
import type {
  ShoppingListOut,
  ShoppingListItemOut,
  ShoppingListItemCreate,
} from "../../../../frontend/app/lib/api/types/household";
import type {
  CreatePlanEntry,
  ReadPlanEntry,
  PlanEntryType,
  PlanRulesOut,
  PlanRulesDay,
  PlanRulesType,
  RecipeSummary,
} from "../../../../frontend/app/lib/api/types/meal-plan";
const lists = "/api/households/shopping/lists";
const items = "/api/households/shopping/items";
const plans = "/api/households/mealplans";
function useAction(reload: () => void) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return {
    error,
    busy,
    run: async (fn: () => Promise<unknown>) => {
      setError("");
      setBusy(true);
      try {
        await fn();
        reload();
        return true;
      } catch (e) {
        setError(errorMessage(e));
        return false;
      } finally {
        setBusy(false);
      }
    },
  };
}
export function ShoppingLists() {
  const tx = usePlanningText();
  const { t } = useTranslation();
  const resource = useResource<Page<ShoppingListOut>>(lists + "?perPage=-1");
  const action = useAction(resource.reload);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Stack spacing={2}>
      <Typography variant="h4">
        {t("shopping-list.shopping-lists", { defaultValue: "Shopping Lists" })}
      </Typography>
      <ResourceStatus
        loading={resource.loading}
        error={resource.error || action.error}
      />
      <Button onClick={() => setOpen(true)}>{tx("Create")}</Button>
      {resource.data?.items.map((list) => (
        <Paper key={list.id} sx={{ p: 2 }}>
          <Link to={"/shopping-lists/" + list.id}>{list.name}</Link>
        </Paper>
      ))}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{tx("Create Shopping List")}</DialogTitle>
        <DialogContent>
          <TextField
            label={tx("New List")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{tx("Cancel")}</Button>
          <Button
            disabled={!name.trim() || action.busy}
            onClick={() =>
              void action
                .run(() => post(lists, { name }))
                .then((ok) => {
                  if (ok) {
                    setOpen(false);
                    setName("");
                  }
                })
            }
          >
            {tx("Create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
export function ShoppingDetail() {
  const tx = usePlanningText();
  const { id } = useParams();
  const r = useResource<ShoppingListOut>(id ? lists + "/" + id : null);
  const recipes = useResource<Page<RecipeSummary>>("/api/recipes?perPage=-1");
  const action = useAction(r.reload);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<ShoppingListItemOut | null>(null);
  const [editNote, setEditNote] = useState("");
  const [rename, setRename] = useState(false);
  const [name, setName] = useState("");
  const [recipe, setRecipe] = useState<RecipeSummary | null>(null);
  const [deleted, setDeleted] = useState(false);
  if (deleted) return <Navigate to="/shopping-lists" />;
  const checked = r.data?.listItems?.filter((x) => x.checked).length ?? 0;
  async function add() {
    if (!id || !note.trim()) return;
    const payload: ShoppingListItemCreate = {
      shoppingListId: id,
      note,
      quantity: 1,
      checked: false,
    };
    if (await action.run(() => post(items, payload))) setNote("");
  }
  return (
    <Stack spacing={2}>
      <Link to="/shopping-lists">{tx("Shopping Lists")}</Link>
      <Typography variant="h4">{r.data?.name ?? "Shopping List"}</Typography>
      <ResourceStatus loading={r.loading} error={r.error || action.error} />
      <Stack direction="row">
        <Button
          onClick={() => {
            setName(r.data?.name ?? "");
            setRename(true);
          }}
        >
          {tx("Rename")}
        </Button>
        <Button
          color="error"
          onClick={() =>
            void action
              .run(() => remove(lists + "/" + id))
              .then((ok) => {
                if (ok) setDeleted(true);
              })
          }
        >
          {tx("Delete List")}
        </Button>
      </Stack>
      <Autocomplete
        options={[]}
        renderInput={(params) => (
          <TextField {...params} label={tx("Add item")} />
        )}
      />
      <TextField
        label={tx("Note")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void add();
          }
        }}
      />
      <Button disabled={action.busy || !note.trim()} onClick={() => void add()}>
        {tx("Add")}
      </Button>
      {checked > 0 && (
        <Typography>
          {checked === 1 ? "One item checked" : `${checked} items checked`}
        </Typography>
      )}
      {r.data?.listItems?.map((item) => (
        <Paper key={item.id} sx={{ p: 1 }}>
          <Stack direction="row" alignItems="center">
            <Checkbox
              checked={Boolean(item.checked)}
              inputProps={{
                "aria-label": `Check ${item.note || item.display}`,
              }}
              onChange={(_, checked) => {
                r.setData((current) =>
                  current
                    ? {
                        ...current,
                        listItems: current.listItems?.map((x) =>
                          x.id === item.id ? { ...x, checked } : x,
                        ),
                      }
                    : current,
                );
                void action.run(() => put(items, [{ ...item, checked }]));
              }}
            />
            <Typography>
              {item.note || item.display || item.food?.name}
            </Typography>
            <Button
              onClick={() => {
                setEditing(item);
                setEditNote(item.note ?? "");
              }}
            >
              {tx("Edit")}
            </Button>
            <Button
              onClick={() =>
                void action.run(() => remove(items + "?ids=" + item.id))
              }
            >
              {tx("Delete")}
            </Button>
          </Stack>
        </Paper>
      ))}
      <Autocomplete
        options={recipes.data?.items ?? []}
        getOptionLabel={(x) => x.name ?? ""}
        value={recipe}
        onChange={(_, x) => setRecipe(x)}
        renderInput={(params) => <TextField {...params} label={tx("Recipe")} />}
      />
      <Button
        disabled={!recipe?.id}
        onClick={() =>
          void action.run(() =>
            post(lists + "/" + id + "/recipe", [
              { recipeId: recipe?.id, recipeIncrementQuantity: 1 },
            ]),
          )
        }
      >
        {tx("Add Recipe")}
      </Button>
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)}>
        <DialogTitle>{tx("Edit Item")}</DialogTitle>
        <DialogContent>
          <TextField
            label={tx("Note")}
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              void action
                .run(() => put(items, [{ ...editing, note: editNote }]))
                .then((ok) => {
                  if (ok) setEditing(null);
                })
            }
          >
            {tx("Save")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={rename} onClose={() => setRename(false)}>
        <DialogTitle>{tx("Rename List")}</DialogTitle>
        <DialogContent>
          <TextField
            label={tx("Name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              void action
                .run(() => put(lists + "/" + id, { ...r.data, name }))
                .then((ok) => {
                  if (ok) setRename(false);
                })
            }
          >
            {tx("Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
export function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function weekDays(start: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return date;
  });
}
const mealTypes: PlanEntryType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "side",
  "snack",
  "drink",
  "dessert",
];
export function MealPlanner({ edit = false }: { edit?: boolean }) {
  const tx = usePlanningText();
  const { t } = useTranslation();
  const [start, setStart] = useState(() => new Date());
  const days = weekDays(start);
  const r = useResource<Page<ReadPlanEntry>>(plans + "?perPage=-1");
  const recipes = useResource<Page<RecipeSummary>>("/api/recipes?perPage=-1");
  const action = useAction(r.reload);
  const [draft, setDraft] = useState<CreatePlanEntry | null>(null);
  const [entry, setEntry] = useState<ReadPlanEntry | null>(null);
  const [noteMode, setNoteMode] = useState(true);
  const [recipe, setRecipe] = useState<RecipeSummary | null>(null);
  const move = (n: number) => {
    const date = new Date(start);
    date.setDate(date.getDate() + n);
    setStart(date);
  };
  return (
    <Stack spacing={2}>
      <Typography variant="h4">
        {t("meal-plan.meal-planner", { defaultValue: "Meal Planner" })}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button onClick={() => move(-7)}>{tx("Previous Week")}</Button>
        <Button onClick={() => setStart(new Date())}>{tx("Today")}</Button>
        <Button onClick={() => move(7)}>{tx("Next Week")}</Button>
        <Button
          component={Link}
          to={"/household/mealplan/planner/" + (edit ? "view" : "edit")}
        >
          {edit ? "View" : "Edit"}
        </Button>
        <Button component={Link} to="/household/mealplan/settings">
          {tx("Settings")}
        </Button>
      </Stack>
      <ResourceStatus loading={r.loading} error={r.error || action.error} />
      {days.map((date) => (
        <Paper key={isoDate(date)} sx={{ p: 2 }}>
          <Typography variant="h6">
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Typography>
          {edit && (
            <Button
              onClick={() => {
                setEntry(null);
                setRecipe(null);
                setNoteMode(true);
                setDraft({
                  date: isoDate(date),
                  entryType: "dinner",
                  title: "",
                  text: "",
                });
              }}
            >
              {tx("New")}
            </Button>
          )}
          {r.data?.items
            .filter((x) => x.date === isoDate(date))
            .map((x) => (
              <Stack key={x.id} direction="row" spacing={1}>
                <Typography>{x.recipe?.name || x.title}</Typography>
                <Typography>{x.text}</Typography>
                {edit && (
                  <>
                    <Button
                      onClick={() => {
                        setEntry(x);
                        setRecipe(x.recipe ?? null);
                        setNoteMode(!x.recipeId);
                        setDraft({ ...x });
                      }}
                    >
                      {tx("Edit")}
                    </Button>
                    <Button
                      onClick={() =>
                        void action.run(() => remove(plans + "/" + x.id))
                      }
                    >
                      {tx("Delete")}
                    </Button>
                  </>
                )}
              </Stack>
            ))}
        </Paper>
      ))}
      <Dialog open={Boolean(draft)} onClose={() => setDraft(null)} fullWidth>
        <DialogTitle>
          {entry ? "Edit Meal Plan" : "Create a New Meal Plan"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row">
              <Button onClick={() => setNoteMode(true)}>{tx("Note")}</Button>
              <Button onClick={() => setNoteMode(false)}>{tx("Recipe")}</Button>
              <Button
                onClick={() =>
                  void action
                    .run(() =>
                      post(plans + "/random", {
                        date: draft?.date,
                        entryType: draft?.entryType,
                      }),
                    )
                    .then((ok) => {
                      if (ok) setDraft(null);
                    })
                }
              >
                {tx("Random")}
              </Button>
            </Stack>
            <TextField
              label={tx("Date")}
              type="date"
              value={draft?.date ?? ""}
              onChange={(e) =>
                setDraft((x) => (x ? { ...x, date: e.target.value } : x))
              }
            />
            <TextField
              select
              label={tx("Meal Type")}
              value={draft?.entryType ?? "dinner"}
              onChange={(e) =>
                setDraft((x) =>
                  x ? { ...x, entryType: e.target.value as PlanEntryType } : x,
                )
              }
            >
              {mealTypes.map((x) => (
                <MenuItem key={x} value={x}>
                  {x}
                </MenuItem>
              ))}
            </TextField>
            {noteMode ? (
              <>
                <TextField
                  label={tx("Meal Title")}
                  value={draft?.title ?? ""}
                  onChange={(e) =>
                    setDraft((x) => (x ? { ...x, title: e.target.value } : x))
                  }
                />
                <TextField
                  label={tx("Note")}
                  multiline
                  value={draft?.text ?? ""}
                  onChange={(e) =>
                    setDraft((x) => (x ? { ...x, text: e.target.value } : x))
                  }
                />
              </>
            ) : (
              <Autocomplete
                options={recipes.data?.items ?? []}
                value={recipe}
                getOptionLabel={(x) => x.name ?? ""}
                onChange={(_, x) => setRecipe(x)}
                renderInput={(params) => (
                  <TextField {...params} label={tx("Recipe")} />
                )}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDraft(null)}>{tx("Cancel")}</Button>
          <Button
            disabled={action.busy || (!noteMode && !recipe?.id)}
            onClick={() => {
              if (draft)
                void action
                  .run(() =>
                    entry
                      ? put(plans + "/" + entry.id, {
                          ...entry,
                          ...draft,
                          recipeId: noteMode ? null : recipe?.id,
                        })
                      : post(plans, {
                          ...draft,
                          recipeId: noteMode ? null : recipe?.id,
                        }),
                  )
                  .then((ok) => {
                    if (ok) setDraft(null);
                  });
            }}
          >
            {tx("Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
export function MealSettings() {
  const tx = usePlanningText();
  const [ruleId, setRuleId] = useState<string | null>(null);
  const r = useResource<Page<PlanRulesOut>>(plans + "/rules?perPage=-1");
  const action = useAction(r.reload);
  const [day, setDay] = useState<PlanRulesDay>("unset");
  const [type, setType] = useState<PlanRulesType>("unset");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <Stack spacing={2}>
      <Typography variant="h4">{tx("Meal Plan Settings")}</Typography>
      <Typography variant="h5">{tx("Meal Plan Rules")}</Typography>
      <ResourceStatus loading={r.loading} error={r.error || action.error} />
      <Typography>{tx("Recipe Rules")}</Typography>
      <Button
        onClick={() => {
          setRuleId(null);
          setDay("unset");
          setType("unset");
          setQuery("");
          setOpen(true);
        }}
      >
        {tx("New Rule")}
      </Button>
      {r.data?.items.map((rule) => (
        <Paper key={rule.id} sx={{ p: 2 }}>
          <Typography>
            {rule.day} {rule.entryType} {rule.queryFilterString}
          </Typography>
          <Button
            onClick={() => {
              setRuleId(rule.id);
              setDay(rule.day ?? "unset");
              setType(rule.entryType ?? "unset");
              setQuery(rule.queryFilterString ?? "");
              setOpen(true);
            }}
          >
            {tx("Edit")}
          </Button>
          <Button
            onClick={() =>
              void action.run(() => remove(plans + "/rules/" + rule.id))
            }
          >
            {tx("Delete")}
          </Button>
        </Paper>
      ))}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{tx("Create Rule")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label={tx("Day")}
              value={day}
              onChange={(e) => setDay(e.target.value as PlanRulesDay)}
            >
              {[
                "unset",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ].map((x) => (
                <MenuItem key={x} value={x}>
                  {x}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={tx("Meal Type")}
              value={type}
              onChange={(e) => setType(e.target.value as PlanRulesType)}
            >
              {["unset", ...mealTypes].map((x) => (
                <MenuItem key={x} value={x}>
                  {x}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={tx("Query Filter")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              void action
                .run(() =>
                  ruleId
                    ? put(plans + "/rules/" + ruleId, {
                        day,
                        entryType: type,
                        queryFilterString: query,
                      })
                    : post(plans + "/rules", {
                        day,
                        entryType: type,
                        queryFilterString: query,
                      }),
                )
                .then((ok) => {
                  if (ok) setOpen(false);
                })
            }
          >
            {tx("Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
export const planningRoutes: RouteObject[] = [
  { path: "shopping-lists", element: <ShoppingLists /> },
  { path: "shopping-lists/:id", element: <ShoppingDetail /> },
  {
    path: "household/mealplan/planner",
    element: <Navigate replace to="view" />,
  },
  { path: "household/mealplan/planner/view", element: <MealPlanner /> },
  { path: "household/mealplan/planner/edit", element: <MealPlanner edit /> },
  { path: "household/mealplan/settings", element: <MealSettings /> },
];
