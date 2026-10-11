import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { RecordForm, parseRecord } from "../../shared/RecordForm";
import { RequireAuth, AuthProvider } from "../../auth/AuthProvider";
import { MemoryRouter, Routes, Route } from "react-router";
import "../../shared/i18n";
afterEach(() => vi.unstubAllGlobals());
it("requires JSON object records instead of array/scalar values", () => {
  expect(parseRecord('{"name":"A"}')).toEqual({ name: "A" });
  expect(() => parseRecord("[]")).toThrow("JSON object");
  expect(() => parseRecord("null")).toThrow("JSON object");
  expect(() => parseRecord("2")).toThrow("JSON object");
});
it("retains hidden identifiers and reports rejected saves without success", async () => {
  const save = vi.fn().mockRejectedValue(new Error("Permission denied"));
  render(
    <RecordForm
      value={{ id: "record-1", name: "Before", enabled: true }}
      omit={["id"]}
      onSave={save}
    />,
  );
  expect(screen.queryByLabelText("id")).toBeNull();
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "After" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Permission denied"),
  );
  expect(save).toHaveBeenCalledWith({
    id: "record-1",
    name: "After",
    enabled: true,
  });
  expect(screen.queryByText("Saved")).toBeNull();
});
it("guards protected routes for anonymous sessions", async () => {
  render(
    <MemoryRouter initialEntries={["/secret"]}>
      <AuthProvider>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="secret" element={<div>Protected</div>} />
          </Route>
          <Route path="login" element={<div>Login required</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByText("Login required")).toBeVisible();
  expect(screen.queryByText("Protected")).toBeNull();
});
