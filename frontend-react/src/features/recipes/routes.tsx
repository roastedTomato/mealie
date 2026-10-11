import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
  type RouteObject,
} from "react-router";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  api,
  tokenFromCookie,
  errorMessage,
  post,
  put,
  remove,
  useResource,
  type Page,
} from "../../shared/api";
import type { Recipe, RecipeSummary } from "../../shared/types";
import type {
  RecipeCommentOut,
  RecipeCategoryResponse,
  RecipeTimelineEventOut,
} from "../../../../frontend/app/lib/api/types/recipe";
import type { ReadCookBook } from "../../../../frontend/app/lib/api/types/cookbook";
import { useText } from "../../shared/useText";
import { useAuth } from "../../auth/AuthProvider";
import { ResourceStatus } from "../../shared/ui";

function Title({ children }: { children: string }) {
  const t = useText();
  return (
    <Typography variant="h4" component="h1" gutterBottom>
      {t(children)}
    </Typography>
  );
}
export function RecipeCards({
  recipes,
  groupSlug,
}: {
  recipes: RecipeSummary[];
  groupSlug: string;
}) {
  return (
    <List>
      {recipes.map((r, i) => (
        <ListItem key={r.id ?? i}>
          <Link to={`/g/${groupSlug}/r/${r.slug}`}>{r.name}</Link>
          <Typography sx={{ ml: 2 }}>{r.description}</Typography>
        </ListItem>
      ))}
    </List>
  );
}
export function RecipeList() {
  const t = useText();
  const { user } = useAuth();
  const { groupSlug = "", id } = useParams();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const params = new URLSearchParams(searchParams);
  params.set("perPage", "100");
  params.set("search", search);
  if (id) params.set("queryFilter", `favoritedBy.id = "${id}"`);
  const r = useResource<Page<RecipeSummary>>(`/api/recipes?${params}`);
  return (
    <>
      <Title>{id ? "User Favorites" : "Recipes"}</Title>
      <TextField
        label={t("Search...")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Button component={Link} to={`/g/${groupSlug}/r/create/new`}>
        {t("Create Recipe")}
      </Button>
      <ResourceStatus {...r} />
      <RecipeCards
        recipes={r.data?.items ?? []}
        groupSlug={groupSlug || user?.groupSlug || ""}
      />
    </>
  );
}
export function FavoriteButton({
  recipeId,
  slug,
}: {
  recipeId: string;
  slug: string;
}) {
  const { user } = useAuth();
  const t = useText();
  const favorites = useResource<{
    ratings: { recipeId: string; isFavorite?: boolean }[];
  }>("/api/users/self/favorites");
  const [error, setError] = useState("");
  const active =
    favorites.data?.ratings?.some((x) => x.recipeId === recipeId) ?? false;
  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        disabled={!user || favorites.loading}
        onClick={async () => {
          try {
            if (active)
              await remove(`/api/users/${user?.id}/favorites/${slug}`);
            else await post(`/api/users/${user?.id}/favorites/${slug}`, {});
            favorites.reload();
          } catch (e) {
            setError(errorMessage(e));
          }
        }}
      >
        {t(active ? "Remove Favorite" : "Add Favorite")}
      </Button>
    </>
  );
}
export function RecipeDetail({ shared = false }: { shared?: boolean }) {
  const t = useText();
  const { slug = "", id = "" } = useParams();
  const navigate = useNavigate();
  const r = useResource<Recipe>(
    shared ? `/api/recipes/shared/${id}` : `/api/recipes/${slug}`,
  );
  const c = useResource<RecipeCommentOut[]>(
    !shared ? `/api/recipes/${slug}/comments` : null,
  );
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Recipe | null>(null);
  const recipe = r.data;
  async function save() {
    try {
      await put(`/api/recipes/${slug}`, draft);
      setEditing(false);
      r.reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <ResourceStatus {...r} />
      {error && <Alert severity="error">{error}</Alert>}
      {recipe && (
        <>
          <Title>{recipe.name ?? "Recipe"}</Title>
          <Typography>{recipe.description}</Typography>
          {!shared && (
            <Stack direction="row" spacing={2}>
              <FavoriteButton recipeId={recipe.id ?? ""} slug={slug} />
              <Button
                onClick={() => {
                  setDraft(recipe);
                  setEditing(true);
                }}
              >
                {t("Edit")}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await remove(`/api/recipes/${slug}`);
                    navigate("../..");
                  } catch (e) {
                    setError(errorMessage(e));
                  }
                }}
              >
                {t("Delete")}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const result = await post<{ id: string }>(
                      "/api/shared/recipes",
                      { recipeId: recipe.id },
                    );
                    await navigator.clipboard.writeText(
                      `${location.origin}${location.pathname.split("/r/")[0]}/shared/r/${result.id}`,
                    );
                  } catch (e) {
                    setError(errorMessage(e));
                  }
                }}
              >
                {t("Share")}
              </Button>
            </Stack>
          )}
          <Title>Ingredients</Title>
          <List>
            {recipe.recipeIngredient?.map((v, i) => (
              <ListItem key={i}>{v.display || v.note || v.food?.name}</ListItem>
            ))}
          </List>
          <Title>Instructions</Title>
          {recipe.recipeInstructions?.map((v, i) => (
            <Typography paragraph key={i}>
              {v.text}
            </Typography>
          ))}
          <Typography>
            {[
              ...(recipe.recipeCategory ?? []),
              ...(recipe.tags ?? []),
              ...(recipe.tools ?? []),
            ]
              .map((x) => x.name)
              .join(" · ")}
          </Typography>
          {!shared && (
            <>
              <Title>Comments</Title>
              {c.data?.map((x) => (
                <Typography paragraph key={x.id}>
                  {x.text}
                </Typography>
              ))}
              <TextField
                label={t("Join the Conversation")}
                multiline
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button
                onClick={async () => {
                  try {
                    await post("/api/comments", {
                      recipeId: recipe.id,
                      text: comment,
                    });
                    setComment("");
                    c.reload();
                  } catch (e) {
                    setError(errorMessage(e));
                  }
                }}
              >
                {t("Submit")}
              </Button>
            </>
          )}
        </>
      )}
      <Dialog open={editing} onClose={() => setEditing(false)}>
        <DialogTitle>Edit Recipe</DialogTitle>
        <DialogContent>
          <TextField
            label={t("Recipe Name")}
            value={draft?.name ?? ""}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <TextField
            label={t("Description")}
            value={draft?.description ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
          <TextField
            label={t("Ingredients")}
            multiline
            value={
              draft?.recipeIngredient
                ?.map((x) => x.display || x.note || "")
                .join("\n") ?? ""
            }
            onChange={(e) =>
              setDraft({
                ...draft,
                recipeIngredient: e.target.value
                  .split("\n")
                  .map((note) => ({ note, originalText: note })),
              })
            }
          />
          <TextField
            label={t("Instructions")}
            multiline
            value={
              draft?.recipeInstructions?.map((x) => x.text).join("\n") ?? ""
            }
            onChange={(e) =>
              setDraft({
                ...draft,
                recipeInstructions: e.target.value
                  .split("\n")
                  .map((text) => ({ text })),
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(false)}>{t("Cancel")}</Button>
          <Button onClick={() => void save()}>{t("Save")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
const headings: Record<string, string> = {
  new: "Create Recipe",
  url: "Scrape Recipe",
  ai: "Import with AI",
  bulk: "Recipe Bulk Importer",
  debug: "Recipe Debugger",
  html: "Import from HTML or JSON",
  zip: "Import from Zip",
};
export function RecipeCreate() {
  const t = useText();
  const { mode = "url", groupSlug = "" } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  async function submit() {
    setError("");
    try {
      if (mode === "new") {
        const slug = await post<string>("/api/recipes", { name: value });
        navigate(`/g/${groupSlug}/r/${slug}`);
        return;
      }
      if (mode === "debug") {
        setStatus(
          JSON.stringify(
            await post("/api/recipes/test-scrape-url", { url: value }),
            null,
            2,
          ),
        );
        return;
      }
      if (mode === "bulk") {
        await post("/api/recipes/create/url/bulk", {
          imports: value
            .split("\n")
            .filter(Boolean)
            .map((url) => ({
              url,
              includeTags: true,
              includeCategories: true,
            })),
        });
        setStatus("Bulk Imports submitted");
        return;
      }
      if (mode === "zip") {
        const body = new FormData();
        if (file) body.append("archive", file);
        const slug = await api<string>("/api/recipes/create/zip", {
          method: "POST",
          body,
        });
        navigate(`/g/${groupSlug}/r/${slug}`);
        return;
      }
      let body: BodyInit;
      let path: string;
      if (mode === "ai") {
        const form = new FormData();
        form.append("content", value);
        if (file) form.append("images", file);
        body = form;
        path = "ai";
      } else {
        path = mode === "html" ? "html-or-json" : "url";
        body = JSON.stringify(
          mode === "html"
            ? { data: value, includeTags: true, includeCategories: true }
            : { url: value, includeTags: true, includeCategories: true },
        );
      }
      const token = tokenFromCookie();
      const response = await fetch(`/api/recipes/create/${path}/stream`, {
        method: "POST",
        body,
        credentials: "include",
        headers: {
          ...(typeof body === "string"
            ? { "Content-Type": "application/json" }
            : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error(await response.text());
      const stream = await response.text();
      const done = stream.match(/event: done\s+data: ([^\n]+)/);
      if (done?.[1]) {
        const result = JSON.parse(done[1]) as { slug: string };
        navigate(`/g/${groupSlug}/r/${result.slug}`);
      } else setStatus(stream);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <Title>Recipe Creation</Title>
      <Stack direction="row" flexWrap="wrap">
        {Object.keys(headings).map((m) => (
          <Button key={m} component={Link} to={`/g/${groupSlug}/r/create/${m}`}>
            {headings[m]}
          </Button>
        ))}
      </Stack>
      <Title>{headings[mode] ?? "Create Recipe"}</Title>
      {mode === "bulk" && <Typography>{t("Bulk Imports")}</Typography>}
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label={t(
          mode === "new"
            ? "Recipe Name"
            : mode === "html"
              ? "HTML or JSON"
              : mode === "ai"
                ? "Content"
                : "URL",
        )}
        multiline={mode !== "new"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {["zip", "ai"].includes(mode) && (
        <input
          aria-label="Upload File"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      )}
      <Button onClick={() => void submit()}>{t("Create")}</Button>
      <Typography sx={{ whiteSpace: "pre-wrap" }}>{status}</Typography>
    </>
  );
}
export function Organizers({
  kind,
  manage = false,
}: {
  kind: string;
  manage?: boolean;
}) {
  const t = useText();
  const { groupSlug = "" } = useParams();
  const r = useResource<Page<RecipeCategoryResponse>>(
    `/api/organizers/${kind}?perPage=100`,
  );
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<RecipeCategoryResponse | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const title =
    kind === "categories" ? "Categories" : kind === "tags" ? "Tags" : "Tools";
  return (
    <>
      {manage && (
        <>
          <Title>Data Management</Title>
          <Typography>
            Select which data set you want to make changes to.
          </Typography>
        </>
      )}
      <Title>
        {manage
          ? `${title === "Categories" ? "Category" : title === "Tags" ? "Tag" : "Tool"} Data`
          : title}
      </Title>
      <ResourceStatus {...r} />
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        onClick={() => {
          setCurrent(null);
          setName("");
          setOpen(true);
        }}
      >
        {t("Create")}
      </Button>
      <Table>
        <TableBody>
          {r.data?.items.map((x) => (
            <TableRow key={x.id}>
              <TableCell>{x.name}</TableCell>
              <TableCell>
                {manage ? (
                  <>
                    <Button
                      onClick={() => {
                        setCurrent(x);
                        setName(x.name);
                        setOpen(true);
                      }}
                    >
                      {t("Edit")}
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          await remove(`/api/organizers/${kind}/${x.id}`);
                          r.reload();
                        } catch (e) {
                          setError(errorMessage(e));
                        }
                      }}
                    >
                      {t("Delete")}
                    </Button>
                  </>
                ) : (
                  <Button
                    component={Link}
                    to={`/g/${groupSlug}?${kind}=${x.id}`}
                  >
                    {t("View Recipes")}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {current ? "Edit" : "Create"} {title}
        </DialogTitle>
        <DialogContent>
          <TextField
            label={t("Name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("Cancel")}</Button>
          <Button
            onClick={async () => {
              try {
                if (current)
                  await put(`/api/organizers/${kind}/${current.id}`, {
                    ...current,
                    name,
                  });
                else await post(`/api/organizers/${kind}`, { name });
                setOpen(false);
                r.reload();
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          >
            {t("Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
export function Cookbooks() {
  const t = useText();
  const { slug, groupSlug = "" } = useParams();
  const navigate = useNavigate();
  const books = useResource<Page<ReadCookBook>>(
    "/api/households/cookbooks?perPage=100",
  );
  const book = books.data?.items.find((x) => x.slug === slug);
  const r = useResource<Page<RecipeSummary>>(
    book ? `/api/recipes?perPage=100&cookbook=${book.id}` : null,
  );
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ReadCookBook | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  function edit(item: ReadCookBook | null) {
    setCurrent(item);
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setFilter(item?.queryFilterString ?? "");
    setOpen(true);
  }
  async function save() {
    try {
      const payload = { name, description, queryFilterString: filter };
      if (current)
        await put(`/api/households/cookbooks/${current.id}`, {
          ...current,
          ...payload,
        });
      else await post("/api/households/cookbooks", payload);
      setOpen(false);
      books.reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function destroy(item: ReadCookBook) {
    try {
      await remove(`/api/households/cookbooks/${item.id}`);
      books.reload();
      if (slug) navigate(`/g/${groupSlug}/cookbooks`);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <Title>{book?.name ?? "Cookbooks"}</Title>
      <ResourceStatus {...books} />
      {error && <Alert severity="error">{error}</Alert>}
      <Button onClick={() => edit(null)}>{t("Create")}</Button>
      {slug ? (
        <>
          <Typography>{book?.description}</Typography>
          {book && (
            <>
              <Button onClick={() => edit(book)}>{t("Edit")}</Button>
              <Button onClick={() => void destroy(book)}>{t("Delete")}</Button>
            </>
          )}
          <ResourceStatus {...r} />
          <RecipeCards recipes={r.data?.items ?? []} groupSlug={groupSlug} />
        </>
      ) : (
        <List>
          {books.data?.items.map((x) => (
            <ListItem key={x.id}>
              <Link to={`/g/${groupSlug}/cookbooks/${x.slug}`}>{x.name}</Link>
              <Button onClick={() => edit(x)}>{t("Edit")}</Button>
              <Button onClick={() => void destroy(x)}>{t("Delete")}</Button>
            </ListItem>
          ))}
        </List>
      )}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {t(current ? "Edit Cookbook" : "Create Cookbook")}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t("Name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label={t("Description")}
              multiline
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
              label={t("Recipe Filter")}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              helperText={t("Filter recipes using a query expression")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("Cancel")}</Button>
          <Button disabled={!name.trim()} onClick={() => void save()}>
            {t("Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
export function Finder() {
  const t = useText();
  const [foods, setFoods] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const r = useResource<{ items: { recipe: RecipeSummary }[] }>(query);
  const { groupSlug = "" } = useParams();
  return (
    <>
      <Title>Recipe Finder</Title>
      <Typography>{t("Selected Ingredients")}</Typography>
      <TextField
        label={t("Food IDs")}
        value={foods}
        onChange={(e) => setFoods(e.target.value)}
      />
      <Button
        onClick={() =>
          setQuery(
            `/api/recipes/suggestions?limit=20&${foods
              .split(",")
              .filter(Boolean)
              .map((x) => `foods=${encodeURIComponent(x.trim())}`)
              .join("&")}`,
          )
        }
      >
        {t("Search")}
      </Button>
      <ResourceStatus {...r} />
      <RecipeCards
        recipes={r.data?.items.map((x) => x.recipe) ?? []}
        groupSlug={groupSlug}
      />
    </>
  );
}
export function Timeline() {
  const { t } = useTranslation();
  const { groupSlug = "" } = useParams();
  const events = useResource<Page<RecipeTimelineEventOut>>(
    "/api/recipes/timeline/events?perPage=100&orderBy=timestamp&orderDirection=desc",
  );
  const recipes = useResource<Page<RecipeSummary>>("/api/recipes?perPage=100");
  return (
    <>
      <Title>Global Timeline</Title>
      <ResourceStatus {...events} />
      {events.data?.items.map((x) => {
        const recipe = recipes.data?.items.find((r) => r.id === x.recipeId);
        return (
          <Stack key={x.id}>
            <Typography>
              {t(x.subject, { defaultValue: x.subject })} · {x.timestamp}
            </Typography>
            <Typography>{x.eventMessage}</Typography>
            <Link to={`/g/${groupSlug}/r/${recipe?.slug}`}>{recipe?.name}</Link>
          </Stack>
        );
      })}
    </>
  );
}
export const recipeRoutes: RouteObject[] = [
  { path: "g/:groupSlug", element: <RecipeList /> },
  { path: "user/:id/favorites", element: <RecipeList /> },
  { path: "g/:groupSlug/r/create", element: <Navigate to="url" replace /> },
  {
    path: "g/:groupSlug/r/create/image",
    element: <Navigate to="../ai" relative="path" replace />,
  },
  { path: "g/:groupSlug/r/create/:mode", element: <RecipeCreate /> },
  { path: "g/:groupSlug/r/:slug", element: <RecipeDetail /> },
  { path: "g/:groupSlug/cookbooks", element: <Cookbooks /> },
  { path: "g/:groupSlug/cookbooks/:slug", element: <Cookbooks /> },
  { path: "g/:groupSlug/recipes/finder", element: <Finder /> },
  { path: "g/:groupSlug/recipes/timeline", element: <Timeline /> },
  ...["categories", "tags", "tools"].flatMap((kind) => [
    {
      path: `g/:groupSlug/recipes/${kind}`,
      element: <Organizers kind={kind} />,
    },
  ]),
];
export const recipePublicRoutes: RouteObject[] = [
  { path: "g/:groupSlug/shared/r/:id", element: <RecipeDetail shared /> },
];
