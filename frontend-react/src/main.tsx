import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { i18nReady, changeLocale } from "./i18n";

async function bootstrap() {
  await i18nReady;
  const savedLocale = localStorage.getItem("mealie.locale");
  if (savedLocale)
    await changeLocale(savedLocale).catch(() => changeLocale("en-US"));
  const root = document.getElementById("root");
  if (!root) throw new Error("Missing application root");
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}
void bootstrap().catch((error: unknown) => {
  const root = document.getElementById("root");
  if (root)
    root.textContent = "Unable to start Mealie. Please reload the page.";
  console.error(error);
});
