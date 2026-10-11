import { text as tr } from "../i18n";
import { useState, type FormEvent } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useParams } from "react-router";
import type {
  Recipe,
  RecipeSuggestionResponse,
  RecipeTimelineEventOut,
} from "../../../frontend/app/lib/api/types/recipe";
import type { ReadCookBook } from "../../../frontend/app/lib/api/types/cookbook";
import { DomainEntityTable } from "../components/DomainEntityTable";
import { useApi } from "../hooks/useApi";
import { api, errorMessage, type PageResult } from "../lib/api/http";
import { normalizeMissingItemLimit } from "../lib/recipe/recipe-finder";
interface Organizer {
  id: string;
  name: string;
  slug: string;
}
export function OrganizerPage() {
  const { organizer = "tags", groupSlug } = useParams();
  const state = useApi<PageResult<Organizer>>(
    `/api/organizers/${organizer}?perPage=-1`,
  );
  const [selected, setSelected] = useState("");
  const recipes = useApi<PageResult<Recipe>>(
    selected ? `/api/recipes?perPage=-1&${organizer}=${selected}` : null,
  );
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {organizer.charAt(0).toUpperCase() + organizer.slice(1)}
      </Typography>
      {(state.error || recipes.error) && (
        <Alert severity="error">{state.error || recipes.error}</Alert>
      )}
      {state.loading && <CircularProgress />}
      <Stack direction="row" flexWrap="wrap">
        {state.data?.items.map((item) => (
          <Button
            key={item.id}
            onClick={() => setSelected(item.id)}
            variant={selected === item.id ? "contained" : "outlined"}
          >
            {item.name}
          </Button>
        ))}
      </Stack>
      {recipes.data?.items.map((recipe) => (
        <Button
          key={recipe.id}
          component={Link}
          to={`/g/${groupSlug}/r/${recipe.slug}`}
        >
          {recipe.name}
        </Button>
      ))}
    </Stack>
  );
}
export function OrganizerDataPage() {
  const { organizer = "tags" } = useParams();
  const singular =
    organizer === "categories"
      ? "Category"
      : organizer === "tools"
        ? "Tool"
        : "Tag";
  return (
    <Stack spacing={2}>
      <Typography variant="h4">{tr("Data Management")}</Typography>
      <Typography>
        {tr("Select which data set you want to make changes to.")}
      </Typography>
      <DomainEntityTable
        key={organizer}
        title={`${singular} Data`}
        endpoint={`/api/organizers/${organizer}`}
      />
    </Stack>
  );
}
export function CookbooksPage() {
  const { groupSlug, slug } = useParams();
  const books = useApi<PageResult<ReadCookBook>>(
    "/api/households/cookbooks?perPage=-1",
  );
  const book = books.data?.items.find((item) => item.slug === slug);
  const recipes = useApi<PageResult<Recipe>>(
    slug
      ? `/api/recipes?perPage=-1&cookbook=${encodeURIComponent(slug)}`
      : null,
  );
  if (!slug)
    return (
      <DomainEntityTable
        title={tr("Cookbooks")}
        endpoint="/api/households/cookbooks"
        fields={[
          { key: "name", label: "Name", required: true },
          { key: "description", label: "Description" },
          {
            key: "queryFilterString",
            label: "Recipe Filter",
            defaultValue: "",
          },
          { key: "public", label: "Public", type: "boolean" },
        ]}
        link={(row) => `/g/${groupSlug}/cookbooks/${row.slug}`}
      />
    );
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {book?.name || "Cookbook"}
      </Typography>
      <Typography>{book?.description}</Typography>
      {(books.error || recipes.error) && (
        <Alert severity="error">{books.error || recipes.error}</Alert>
      )}
      {recipes.loading && <CircularProgress />}
      {recipes.data?.items.map((recipe) => (
        <Button
          key={recipe.id}
          component={Link}
          to={`/g/${groupSlug}/r/${recipe.slug}`}
        >
          {recipe.name}
        </Button>
      ))}
    </Stack>
  );
}
export function FinderPage() {
  const { groupSlug } = useParams();
  const foods = useApi<PageResult<Organizer>>("/api/foods?perPage=-1");
  const tools = useApi<PageResult<Organizer>>(
    "/api/organizers/tools?perPage=-1",
  );
  const [selected, setSelected] = useState<Organizer[]>([]);
  const [selectedTools, setTools] = useState<Organizer[]>([]);
  const [missing, setMissing] = useState(0);
  const [results, setResults] = useState<RecipeSuggestionResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function search(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const query = new URLSearchParams({
      maxMissingFoods: String(normalizeMissingItemLimit(missing)),
      limit: "20",
    });
    selected.forEach((food) => query.append("foods", food.id));
    selectedTools.forEach((tool) => query.append("tools", tool.id));
    try {
      setResults(await api.get(`/api/recipes/suggestions?${query}`));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2} component="form" onSubmit={search}>
      <Typography component="h1" variant="h4">
        {tr("Recipe Finder")}
      </Typography>
      <Typography component="h2" variant="h5">
        {tr("Selected Ingredients")}
      </Typography>
      <Autocomplete
        multiple
        options={foods.data?.items ?? []}
        value={selected}
        getOptionLabel={(item) => item.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, value) => setSelected(value)}
        renderInput={(params) => (
          <TextField {...params} label={tr("Ingredients")} />
        )}
      />
      <Autocomplete
        multiple
        options={tools.data?.items ?? []}
        value={selectedTools}
        getOptionLabel={(item) => item.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, value) => setTools(value)}
        renderInput={(params) => <TextField {...params} label={tr("Tools")} />}
      />
      <TextField
        label={tr("Maximum Missing Ingredients")}
        type="number"
        value={missing}
        onChange={(e) => setMissing(Number(e.target.value))}
      />
      <Button type="submit" disabled={busy}>
        {tr("Find Recipes")}
      </Button>
      {(error || foods.error || tools.error) && (
        <Alert severity="error">{error || foods.error || tools.error}</Alert>
      )}
      {results?.items.map((item) => (
        <Stack key={item.recipe.id}>
          <Button component={Link} to={`/g/${groupSlug}/r/${item.recipe.slug}`}>
            {item.recipe.name}
          </Button>
          <Typography>
            {tr("Missing:")}
            {item.missingFoods.map((food) => food.name).join(", ")}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
export function TimelinePage() {
  const { groupSlug } = useParams();
  const events = useApi<PageResult<RecipeTimelineEventOut>>(
    "/api/recipes/timeline/events?perPage=100&orderBy=timestamp&orderDirection=desc",
  );
  const recipes = useApi<PageResult<Recipe>>("/api/recipes?perPage=-1");
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Global Timeline")}
      </Typography>
      {(events.error || recipes.error) && (
        <Alert severity="error">{events.error || recipes.error}</Alert>
      )}
      {events.data?.items.map((event) => {
        const recipe = recipes.data?.items.find(
          (recipe) => recipe.id === event.recipeId,
        );
        return (
          <Stack key={event.id}>
            <Typography>{event.subject}</Typography>
            <Typography>{event.eventMessage}</Typography>
            <Button component={Link} to={`/g/${groupSlug}/r/${recipe?.slug}`}>
              {recipe?.name}
            </Button>
            <Typography>{event.timestamp}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
