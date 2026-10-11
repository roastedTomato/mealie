import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import "../../shared/i18n";
vi.mock("../../auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "u1", groupSlug: "home" } }),
}));
import {
  RecipeList,
  RecipeDetail,
  Organizers,
  FavoriteButton,
  Cookbooks,
} from "./routes";
function response(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200 });
}
beforeEach(() => {
  vi.restoreAllMocks();
});
describe("recipe module backend interactions", () => {
  it("search sends query and replaces results", async () => {
    const mock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) =>
        response({
          items: String(input).includes("search=salad")
            ? [{ id: "2", name: "Salad", slug: "salad" }]
            : [{ id: "1", name: "Soup", slug: "soup" }],
          total: 1,
        }),
      );
    render(
      <MemoryRouter initialEntries={["/g/home"]}>
        <Routes>
          <Route path="/g/:groupSlug" element={<RecipeList />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("link", { name: "Soup" }),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Search..."), "salad");
    expect(
      await screen.findByRole("link", { name: "Salad" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Soup" })).toBeNull(),
    );
    expect(
      mock.mock.calls.some((x) => String(x[0]).includes("search=salad")),
    ).toBe(true);
  });
  it("comment persists backend recipe ID and reloads comments", async () => {
    let saved = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toEqual({
          recipeId: "r1",
          text: "Delicious",
        });
        saved = true;
        return response({ id: "c1" });
      }
      if (String(input).endsWith("/self/favorites"))
        return response({ ratings: [] });
      return response(
        String(input).endsWith("/comments")
          ? saved
            ? [{ id: "c1", text: "Delicious" }]
            : []
          : {
              id: "r1",
              name: "Soup",
              recipeIngredient: [{ display: "Tomato" }],
              recipeInstructions: [{ text: "Boil" }],
            },
      );
    });
    render(
      <MemoryRouter initialEntries={["/g/home/r/soup"]}>
        <Routes>
          <Route path="/g/:groupSlug/r/:slug" element={<RecipeDetail />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Tomato")).toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText("Join the Conversation"),
      "Delicious",
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("Delicious")).toBeInTheDocument();
  });
  it("organizer create uses actual API and reloads table", async () => {
    let created = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toEqual({ name: "Weeknight" });
        created = true;
        return response({ id: "tag1", name: "Weeknight" });
      }
      return response({
        items: created ? [{ id: "tag1", name: "Weeknight" }] : [],
        total: created ? 1 : 0,
      });
    });
    render(
      <MemoryRouter>
        <Organizers kind="tags" manage />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    await userEvent.type(screen.getByLabelText("Name"), "Weeknight");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByRole("cell", { name: "Weeknight" }),
    ).toBeInTheDocument();
  });
});

describe("favorites and cookbook mutations", () => {
  it("favorite toggle adds then removes with authenticated user and slug", async () => {
    let favorite = false;
    const calls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (init?.method) {
        calls.push(`${init.method} ${input}`);
        favorite = init.method === "POST";
        return response({});
      }
      return response({
        ratings: favorite ? [{ recipeId: "r1", isFavorite: true }] : [],
      });
    });
    render(
      <MemoryRouter>
        <FavoriteButton recipeId="r1" slug="soup" />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Add Favorite" }),
      ).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Add Favorite" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Remove Favorite" }),
    );
    await screen.findByRole("button", { name: "Add Favorite" });
    expect(calls).toEqual([
      "POST /api/users/u1/favorites/soup",
      "DELETE /api/users/u1/favorites/soup",
    ]);
  });
  it("cookbook create errors keep entered data and show backend error", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) =>
      init?.method === "POST"
        ? new Response(
            JSON.stringify({ detail: "Cookbook name already exists" }),
            { status: 409 },
          )
        : response({ items: [], total: 0 }),
    );
    render(
      <MemoryRouter>
        <Cookbooks />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    await userEvent.type(screen.getByLabelText("Name"), "Family");
    await userEvent.type(
      screen.getByLabelText("Recipe Filter"),
      'tags.name = "dinner"',
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cookbook name already exists",
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Family");
  });
  it("cookbook edit and delete use item IDs and reload persistent data", async () => {
    let name = "Family";
    let deleted = false;
    const methods: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (init?.method) {
        methods.push(`${init.method} ${input}`);
        if (init.method === "PUT")
          name = (JSON.parse(String(init.body)) as { name: string }).name;
        if (init.method === "DELETE") deleted = true;
        return response({});
      }
      return response({
        items: deleted
          ? []
          : [
              {
                id: "book1",
                slug: "family",
                name,
                groupId: "g1",
                householdId: "h1",
              },
            ],
        total: 1,
      });
    });
    render(
      <MemoryRouter>
        <Cookbooks />
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));
    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.type(screen.getByLabelText("Name"), "New Family");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("link", { name: "New Family" });
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "New Family" })).toBeNull(),
    );
    expect(methods).toEqual([
      "PUT /api/households/cookbooks/book1",
      "DELETE /api/households/cookbooks/book1",
    ]);
  });
});

it("cookbook create sends name, description and filter then reloads list", async () => {
  let created = false;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
    if (init?.method === "POST") {
      expect(JSON.parse(String(init.body))).toEqual({
        name: "Quick Meals",
        description: "Weekday cooking",
        queryFilterString: "",
      });
      created = true;
      return response({ id: "book2" });
    }
    return response({
      items: created
        ? [{ id: "book2", name: "Quick Meals", slug: "quick-meals" }]
        : [],
      total: created ? 1 : 0,
    });
  });
  render(
    <MemoryRouter>
      <Cookbooks />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Create" }));
  await userEvent.type(screen.getByLabelText("Name"), "Quick Meals");
  await userEvent.type(screen.getByLabelText("Description"), "Weekday cooking");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(
    await screen.findByRole("link", { name: "Quick Meals" }),
  ).toBeInTheDocument();
});
