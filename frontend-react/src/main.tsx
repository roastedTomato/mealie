import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { ready, changeLanguage } from "./shared/i18n";
async function start() {
  await ready;
  const saved = localStorage.getItem("mealie.locale");
  if (saved) await changeLanguage(saved).catch(() => changeLanguage("en-US"));
  const root = document.getElementById("root");
  if (!root) throw new Error("Missing root");
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}
void start().catch((error: unknown) => {
  const root = document.getElementById("root");
  if (root)
    root.textContent = "Unable to start Mealie. Please reload the page.";
  console.error(error);
});
