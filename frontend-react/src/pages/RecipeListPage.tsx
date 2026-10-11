import { text as tr } from "../i18n";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link, useParams } from "react-router";
import type { Recipe } from "../../../frontend/app/lib/api/types/recipe";
import { useApi } from "../hooks/useApi";
import type { PageResult } from "../lib/api/http";
export function RecipeListPage() {
  const { groupSlug } = useParams();
  const [search, setSearch] = useState("");
  const { data, error, loading } = useApi<PageResult<Recipe>>(
    `/api/recipes?perPage=50&search=${encodeURIComponent(search)}`,
  );
  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        {tr("Recipes")}
      </Typography>
      <Button component={Link} to={`/g/${groupSlug}/r/create/new`}>
        {tr("Create Recipe")}
      </Button>
      <TextField
        label={tr("Search...")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading && <CircularProgress aria-label={tr("Loading recipes")} />}
      {error && <Alert severity="error">{error}</Alert>}
      {data?.items.map((recipe) => (
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
