import { text as tr } from "../i18n";
import { useState, type FormEvent } from "react";
import {
  Alert,
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
import { Link, useNavigate, useParams } from "react-router";
import type {
  ShoppingListOut,
  ShoppingListItemOut,
} from "../../../frontend/app/lib/api/types/household";
import type { Recipe } from "../../../frontend/app/lib/api/types/recipe";
import { useApi } from "../hooks/useApi";
import { api, errorMessage, type PageResult } from "../lib/api/http";
export function ShoppingListsPage() {
  const lists = useApi<PageResult<ShoppingListOut>>(
    "/api/households/shopping/lists?perPage=-1",
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/api/households/shopping/lists", { name });
      setOpen(false);
      setName("");
      lists.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Shopping Lists")}
      </Typography>
      <Button onClick={() => setOpen(true)}>{tr("Create")}</Button>
      {(lists.error || error) && (
        <Alert severity="error">{error || lists.error}</Alert>
      )}
      {lists.data?.items.map((list) => (
        <Paper key={list.id} sx={{ p: 2 }}>
          <Button component={Link} to={`/shopping-lists/${list.id}`}>
            {list.name}
          </Button>
        </Paper>
      ))}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{tr("Create Shopping List")}</DialogTitle>
        <form onSubmit={create}>
          <DialogContent>
            <TextField
              label={tr("New List")}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>{tr("Cancel")}</Button>
            <Button type="submit" disabled={busy}>
              {tr("Create")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
interface Food {
  id: string;
  name: string;
}
export function ShoppingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const list = useApi<ShoppingListOut>(`/api/households/shopping/lists/${id}`);
  const foods = useApi<PageResult<Food>>("/api/foods?perPage=-1");
  const recipes = useApi<PageResult<Recipe>>("/api/recipes?perPage=-1");
  const [note, setNote] = useState("");
  const [food, setFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [recipeId, setRecipeId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rename, setRename] = useState(false);
  const [name, setName] = useState("");
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      list.reload();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  async function add(event: FormEvent) {
    event.preventDefault();
    if (!note.trim() && !food) return;
    await act(async () => {
      await api.post("/api/households/shopping/items", {
        shoppingListId: id,
        note,
        display: note || food?.name,
        foodId: food?.id ?? null,
        quantity,
      });
      setNote("");
      setFood(null);
    });
  }
  async function check(item: ShoppingListItemOut, checked: boolean) {
    const previous = list.data;
    list.setData((value) =>
      value
        ? {
            ...value,
            listItems: value.listItems?.map((row) =>
              row.id === item.id ? { ...row, checked } : row,
            ),
          }
        : value,
    );
    setBusy(true);
    setError("");
    try {
      await api.put(`/api/households/shopping/items/${item.id}`, {
        ...item,
        checked,
      });
    } catch (reason) {
      list.setData(previous);
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  const checked =
    list.data?.listItems?.filter((item) => item.checked).length ?? 0;
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {list.data?.name || "Shopping List"}
      </Typography>
      {(list.error || error) && (
        <Alert severity="error">{error || list.error}</Alert>
      )}
      <Stack direction="row">
        <Button component={Link} to="/shopping-lists">
          {tr("Shopping Lists")}
        </Button>
        <Button
          onClick={() => {
            setName(list.data?.name || "");
            setRename(true);
          }}
        >
          {tr("Rename")}
        </Button>
        <Button
          color="error"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Delete this shopping list?"))
              void act(async () => {
                await api.delete(`/api/households/shopping/lists/${id}`);
                navigate("/shopping-lists");
              });
          }}
        >
          {tr("Delete List")}
        </Button>
      </Stack>
      <Stack component="form" onSubmit={add} spacing={1}>
        <Autocomplete
          options={foods.data?.items ?? []}
          value={food}
          getOptionLabel={(item) => item.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_, value) => setFood(value)}
          renderInput={(params) => (
            <TextField {...params} label={tr("Add item")} />
          )}
        />
        <TextField
          label={tr("Note")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <TextField
          label={tr("Quantity")}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <Button type="submit" disabled={busy}>
          {tr("Add")}
        </Button>
      </Stack>
      <Typography>
        {checked === 1 ? "One item checked" : `${checked} items checked`}
      </Typography>
      {list.data?.listItems?.map((item) => (
        <Paper key={item.id} sx={{ p: 1 }}>
          <Stack direction="row" alignItems="center">
            <Checkbox
              checked={item.checked ?? false}
              inputProps={{
                "aria-label": `Check ${item.note || item.display}`,
              }}
              disabled={busy}
              onChange={(e) => {
                void check(item, e.target.checked);
              }}
            />
            <Typography
              sx={{ textDecoration: item.checked ? "line-through" : "none" }}
            >
              {item.note || item.display || item.food?.name}
            </Typography>
            <Button
              disabled={busy}
              onClick={() => {
                void act(async () => {
                  await api.delete(`/api/households/shopping/items/${item.id}`);
                });
              }}
            >
              {tr("Delete")}
            </Button>
          </Stack>
        </Paper>
      ))}
      <Stack direction="row" spacing={1}>
        <TextField
          select
          label={tr("Recipe")}
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          {recipes.data?.items.map((recipe) => (
            <MenuItem key={recipe.id} value={recipe.id ?? ""}>
              {recipe.name}
            </MenuItem>
          ))}
        </TextField>
        <Button
          disabled={!recipeId || busy}
          onClick={() => {
            void act(async () => {
              await api.post(`/api/households/shopping/lists/${id}/recipe`, [
                { recipeId, recipeIncrementQuantity: 1 },
              ]);
            });
          }}
        >
          {tr("Add Recipe Ingredients")}
        </Button>
      </Stack>
      <Button
        disabled={!checked || busy}
        onClick={() => {
          void act(async () => {
            const selected =
              list.data?.listItems?.filter((item) => item.checked) ?? [];
            for (const item of selected)
              await api.delete(`/api/households/shopping/items/${item.id}`);
          });
        }}
      >
        {tr("Delete Checked Items")}
      </Button>
      <Dialog open={rename} onClose={() => setRename(false)}>
        <DialogTitle>{tr("Rename List")}</DialogTitle>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void act(async () => {
              await api.put(`/api/households/shopping/lists/${id}`, {
                ...list.data,
                name,
              });
              setRename(false);
            });
          }}
        >
          <DialogContent>
            <TextField
              label={tr("Name")}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button type="submit" disabled={busy}>
              {tr("Save")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
