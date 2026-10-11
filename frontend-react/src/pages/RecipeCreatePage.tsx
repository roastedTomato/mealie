import { text as tr } from "../i18n";
import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { api, errorMessage, request } from "../lib/api/http";
import { importRecipe } from "../lib/api/import-stream";
import { useApi } from "../hooks/useApi";
interface Report {
  id: string;
  name: string;
}
const modes: Record<string, string> = {
  new: "Create Recipe",
  url: "Scrape Recipe",
  ai: "Import with AI",
  bulk: "Recipe Bulk Importer",
  html: "Import from HTML or JSON",
  zip: "Import from Zip",
  debug: "Recipe Debugger",
};
export function RecipeCreatePage() {
  const { groupSlug, mode = "url" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [url, setUrl] = useState(params.get("recipe_import_url") ?? "");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState(true);
  const [categories, setCategories] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [debug, setDebug] = useState("");
  const reports = useApi<Report[]>(
    mode === "bulk" ? "/api/groups/reports?report_type=bulk_import" : null,
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setProgress("");
    setBusy(true);
    try {
      let slug: string | undefined;
      if (mode === "new")
        slug = await api.post<string>("/api/recipes", { name });
      else if (mode === "zip") {
        if (!files[0]) throw new Error("Choose a zip archive");
        const form = new FormData();
        form.set("archive", files[0]);
        slug = await request<string>("/api/recipes/create/zip", {
          method: "POST",
          body: form,
        });
      } else if (mode === "debug")
        setDebug(
          JSON.stringify(
            await api.post("/api/recipes/test-scrape-url", {
              url,
              useOpenAI: false,
            }),
            null,
            2,
          ),
        );
      else if (mode === "bulk") {
        await api.post("/api/recipes/create/url/bulk", {
          imports: content
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean)
            .map((url) => ({
              url,
              includeTags: tags,
              includeCategories: categories,
            })),
        });
        reports.reload();
        setProgress("Import submitted");
      } else if (mode === "ai") {
        const form = new FormData();
        if (content) form.set("content", content);
        if (url) form.set("url", url);
        files.forEach((file) => form.append("images", file));
        slug = await importRecipe(
          "/api/recipes/create/ai/stream",
          form,
          setProgress,
        );
      } else
        slug = await importRecipe(
          mode === "html"
            ? "/api/recipes/create/html-or-json/stream"
            : "/api/recipes/create/url/stream",
          mode === "html"
            ? {
                data: content,
                url: url || null,
                includeTags: tags,
                includeCategories: categories,
              }
            : { url, includeTags: tags, includeCategories: categories },
          setProgress,
        );
      if (slug) navigate(`/g/${groupSlug}/r/${slug}`);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">
        {tr("Recipe Creation")}
      </Typography>
      <Stack direction="row" flexWrap="wrap">
        {Object.entries(modes).map(([key, title]) => (
          <Button
            key={key}
            component={Link}
            to={`/g/${groupSlug}/r/create/${key}`}
          >
            {title}
          </Button>
        ))}
      </Stack>
      <Typography component="h2" variant="h5">
        {modes[mode] ?? modes.url}
      </Typography>
      <Stack component="form" spacing={2} onSubmit={submit}>
        {error && <Alert severity="error">{error}</Alert>}
        {progress && <Alert severity="info">{progress}</Alert>}
        {mode === "new" && (
          <TextField
            label={tr("Recipe Name")}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        {["url", "debug", "html", "ai"].includes(mode) && (
          <TextField
            label={tr("Recipe URL")}
            type="url"
            required={mode === "url" || mode === "debug"}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}
        {["html", "ai", "bulk"].includes(mode) && (
          <TextField
            label={
              mode === "bulk" ? "Recipe URLs (one per line)" : "Recipe Content"
            }
            multiline
            minRows={6}
            required={mode !== "ai"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        )}
        {["zip", "ai"].includes(mode) && (
          <Button component="label">
            {mode === "zip" ? "Upload Zip" : "Upload Images"}
            <input
              aria-label={mode === "zip" ? "Zip Archive" : "Recipe Images"}
              type="file"
              accept={mode === "zip" ? ".zip" : "image/*"}
              multiple={mode === "ai"}
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </Button>
        )}
        {["url", "html", "bulk"].includes(mode) && (
          <>
            <FormControlLabel
              label={tr("Import Keywords as Tags")}
              control={
                <Checkbox
                  checked={tags}
                  onChange={(e) => setTags(e.target.checked)}
                />
              }
            />
            <FormControlLabel
              label={tr("Import Categories")}
              control={
                <Checkbox
                  checked={categories}
                  onChange={(e) => setCategories(e.target.checked)}
                />
              }
            />
          </>
        )}
        <Button type="submit" variant="contained" disabled={busy}>
          {mode === "new" ? "Create" : mode === "debug" ? "Debug" : "Import"}
        </Button>
      </Stack>
      {debug && (
        <Typography component="pre" sx={{ whiteSpace: "pre-wrap" }}>
          {debug}
        </Typography>
      )}
      {mode === "bulk" && (
        <>
          <Typography component="h2" variant="h5">
            {tr("Bulk Imports")}
          </Typography>
          {reports.error && <Alert severity="error">{reports.error}</Alert>}
          {reports.data?.map((report) => (
            <Button
              key={report.id}
              component={Link}
              to={`/group/reports/${report.id}`}
            >
              {report.name || report.id}
            </Button>
          ))}
        </>
      )}
    </Stack>
  );
}
