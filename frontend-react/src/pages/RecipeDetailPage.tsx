import { text as tr } from "../i18n";
import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router";
import type {
  Recipe,
  RecipeCommentOut,
  RecipeShareToken,
} from "../../../frontend/app/lib/api/types/recipe";
import { useAuth } from "../auth/AuthProvider";
import { useApi } from "../hooks/useApi";
import { api, errorMessage } from "../lib/api/http";
export function RecipeDetailPage({ shared = false }: { shared?: boolean }) {
  const { slug, id, groupSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const recipe = useApi<Recipe>(
    shared ? `/api/recipes/shared/${id}` : `/api/recipes/${slug}`,
  );
  const comments = useApi<RecipeCommentOut[]>(
    !shared && slug ? `/api/recipes/${slug}/comments` : null,
  );
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Recipe>({});
  const [deleting, setDeleting] = useState(false);
  const [share, setShare] = useState("");
  const [favorite, setFavorite] = useState(false);
  useEffect(() => {
    if (recipe.data) setDraft(recipe.data);
  }, [recipe.data]);
  useEffect(() => {
    setComment("");
    setEditing(false);
    setShare("");
  }, [slug, id]);
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  const data = recipe.data;
  async function addComment(event: FormEvent) {
    event.preventDefault();
    if (!data?.id || !comment.trim()) return;
    await act(async () => {
      await api.post("/api/comments", { recipeId: data.id, text: comment });
      setComment("");
      comments.reload();
    });
  }
  if (recipe.loading)
    return <CircularProgress aria-label={tr("Loading recipe")} />;
  if (recipe.error) return <Alert severity="error">{recipe.error}</Alert>;
  if (!data) return null;
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h3">
        {data.name}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography sx={{ whiteSpace: "pre-wrap" }}>
        {data.description}
      </Typography>
      <Typography>
        {data.recipeYield} {data.totalTime}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {[
          ...(data.recipeCategory ?? []),
          ...(data.tags ?? []),
          ...(data.tools ?? []),
        ].map((item) => (
          <Chip key={item.id} label={item.name} />
        ))}
      </Stack>
      <Button onClick={() => window.print()}>{tr("Print")}</Button>
      {!shared && user && (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button onClick={() => setEditing(!editing)}>
            {tr("Edit Recipe")}
          </Button>
          <Button color="error" onClick={() => setDeleting(true)}>
            {tr("Delete Recipe")}
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              void act(async () => {
                await (favorite
                  ? api.delete(`/api/users/${user.id}/favorites/${slug}`)
                  : api.post(`/api/users/${user.id}/favorites/${slug}`));
                setFavorite(!favorite);
              });
            }}
          >
            {favorite ? "Remove Favorite" : "Add Favorite"}
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              void act(async () => {
                const token = await api.post<RecipeShareToken>(
                  "/api/shared/recipes",
                  { recipeId: data.id },
                );
                setShare(
                  `${location.origin}/g/${groupSlug}/shared/r/${token.id}`,
                );
              });
            }}
          >
            {tr("Share")}
          </Button>
        </Stack>
      )}
      {share && (
        <TextField
          label={tr("Share URL")}
          value={share}
          slotProps={{ input: { readOnly: true } }}
        />
      )}
      {editing ? (
        <Stack
          component="form"
          spacing={2}
          onSubmit={(event) => {
            event.preventDefault();
            void act(async () => {
              const updated = await api.patch<Recipe>(
                `/api/recipes/${slug}`,
                draft,
              );
              setEditing(false);
              navigate(`/g/${groupSlug}/r/${updated.slug}`);
              recipe.reload();
            });
          }}
        >
          <TextField
            label={tr("Recipe Name")}
            required
            value={draft.name ?? ""}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <TextField
            label={tr("Description")}
            multiline
            value={draft.description ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
          <TextField
            label={tr("Ingredients")}
            multiline
            minRows={3}
            value={
              draft.recipeIngredient
                ?.map((item) => item.note || item.display || "")
                .join("\n") ?? ""
            }
            onChange={(e) =>
              setDraft({
                ...draft,
                recipeIngredient: e.target.value.split("\n").map((note) => ({
                  note,
                  display: note,
                  referenceId: crypto.randomUUID(),
                })),
              })
            }
          />
          <TextField
            label={tr("Instructions")}
            multiline
            minRows={3}
            value={
              draft.recipeInstructions?.map((step) => step.text).join("\n") ??
              ""
            }
            onChange={(e) =>
              setDraft({
                ...draft,
                recipeInstructions: e.target.value
                  .split("\n")
                  .map((text) => ({ text, id: crypto.randomUUID() })),
              })
            }
          />
          <FormControlLabel
            label={tr("Public Recipe")}
            control={
              <Checkbox
                checked={draft.settings?.public ?? false}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    settings: { ...draft.settings, public: e.target.checked },
                  })
                }
              />
            }
          />
          <Button type="submit" disabled={busy}>
            {tr("Save")}
          </Button>
          <Button
            onClick={() => {
              setDraft(data);
              setEditing(false);
            }}
          >
            {tr("Cancel")}
          </Button>
        </Stack>
      ) : (
        <>
          <Typography component="h2" variant="h5">
            {tr("Ingredients")}
          </Typography>
          {data.recipeIngredient?.map((item, index) => (
            <FormControlLabel
              key={item.referenceId ?? index}
              control={<Checkbox />}
              label={
                item.display ||
                item.note ||
                [item.quantity, item.unit?.name, item.food?.name]
                  .filter(Boolean)
                  .join(" ")
              }
            />
          ))}
          <Typography component="h2" variant="h5">
            {tr("Instructions")}
          </Typography>
          {data.recipeInstructions?.map((step, index) => (
            <Paper key={step.id ?? index} sx={{ p: 2 }}>
              <Typography component="h3">
                {step.title || `Step ${index + 1}`}
              </Typography>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>
                {step.text}
              </Typography>
            </Paper>
          ))}
          {!!data.notes?.length && (
            <Typography component="h2" variant="h5">
              {tr("Notes")}
            </Typography>
          )}
          {data.notes?.map((note, index) => (
            <Typography key={index}>
              {note.title} {note.text}
            </Typography>
          ))}
          {data.nutrition && (
            <Stack>
              <Typography component="h2" variant="h5">
                {tr("Nutrition")}
              </Typography>
              {Object.entries(data.nutrition)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <Typography key={key}>
                    {key}: {value}
                  </Typography>
                ))}
            </Stack>
          )}
        </>
      )}
      {!shared && (
        <>
          <Typography component="h2" variant="h5">
            {tr("Comments")}
          </Typography>
          {comments.error && <Alert severity="error">{comments.error}</Alert>}
          {comments.data?.map((item) => (
            <Paper key={item.id} sx={{ p: 2 }}>
              <Typography>
                {item.user.fullName || item.user.username}
              </Typography>
              <Typography>{item.text}</Typography>
            </Paper>
          ))}
          <Stack component="form" onSubmit={addComment} spacing={1}>
            <TextField
              label={tr("Join the Conversation")}
              multiline
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              {tr("Submit")}
            </Button>
          </Stack>
        </>
      )}
      <Button component={Link} to={`/g/${groupSlug}`}>
        {tr("Back to Recipes")}
      </Button>
      <Dialog open={deleting} onClose={() => setDeleting(false)}>
        <DialogTitle>{tr("Delete Recipe")}</DialogTitle>
        <DialogContent>
          {tr("Delete")}
          {data.name}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(false)}>{tr("Cancel")}</Button>
          <Button
            color="error"
            disabled={busy}
            onClick={() => {
              void act(async () => {
                await api.delete(`/api/recipes/${slug}`);
                navigate(`/g/${groupSlug}`);
              });
            }}
          >
            {tr("Delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
