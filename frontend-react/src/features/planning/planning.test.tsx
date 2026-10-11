import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "../../shared/i18n";
import { isoDate, weekDays, ShoppingLists, MealPlanner } from "./routes";
vi.mock("../../shared/api", async () => {
  const original = await vi.importActual<object>("../../shared/api");
  return {
    ...original,
    useResource: () => ({
      data: { items: [] },
      loading: false,
      error: "",
      reload: vi.fn(),
    }),
    post: vi.fn().mockResolvedValue({ id: "new" }),
  };
});
describe("planning", () => {
  it("advances local calendar dates across month boundaries", () => {
    const days = weekDays(new Date(2026, 0, 29));
    expect(days.map(isoDate)).toEqual([
      "2026-01-29",
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
      "2026-02-03",
      "2026-02-04",
    ]);
  });
  it("opens list creation and submits actual list payload", async () => {
    const { post } = await import("../../shared/api");
    render(
      <MemoryRouter>
        <ShoppingLists />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    fireEvent.change(screen.getByLabelText("New List"), {
      target: { value: "Weekend" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Create" }).at(-1)!);
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/api/households/shopping/lists", {
        name: "Weekend",
      }),
    );
  });
  it("creates dated meal note with selected entry type", async () => {
    const { post } = await import("../../shared/api");
    render(
      <MemoryRouter>
        <MealPlanner edit />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "New" })[0]!);
    fireEvent.change(screen.getByLabelText("Meal Title"), {
      target: { value: "Picnic" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/api/households/mealplans",
        expect.objectContaining({
          date: isoDate(new Date()),
          title: "Picnic",
          entryType: "dinner",
          recipeId: null,
        }),
      ),
    );
  });
});
