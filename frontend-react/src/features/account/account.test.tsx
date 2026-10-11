import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { LoginPage, RegisterPage } from "./AuthPages";
import { AuthProvider } from "../../auth/AuthProvider";
import { setBearer } from "../../shared/api";
import "../../shared/i18n";
afterEach(() => {
  vi.unstubAllGlobals();
  setBearer(null);
});
it("submits credentials as form data and surfaces server rejection", async () => {
  const request = vi
    .fn()
    .mockResolvedValue(
      new Response('{"detail":"Incorrect password"}', { status: 401 }),
    );
  vi.stubGlobal("fetch", request);
  render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText(/^Email or Username/), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^Password/), {
    target: { value: "wrong" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Login" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials"),
  );
  expect(request.mock.calls[0]?.[0]).toBe("/api/auth/token");
  expect(request.mock.calls[0]?.[1].body.get("username")).toBe(
    "person@example.com",
  );
});
it("prevents mismatched registration passwords from reaching API", async () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText(/^Password/), {
    target: { value: "one" },
  });
  fireEvent.change(screen.getByLabelText(/^Confirm Password/), {
    target: { value: "two" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Register" }).closest("form")!,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Passwords must match");
  expect(request).not.toHaveBeenCalled();
});
