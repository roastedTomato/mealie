# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/shopping.spec.ts >> shopping lists >> [flow] add an item and check it off
- Location: tests/flows/shopping.spec.ts:19:7

# Error details

```
Error: locator.check: Clicking the checkbox did not change its state
Call log:
  - waiting for getByText('E2E Hammer mv20ms2hgn', { exact: true }).visible().first().locator('xpath=ancestor::*[.//input[@type=\'checkbox\'] or .//*[@role=\'checkbox\']][1]').getByRole('checkbox').first()
    - locator resolved to <input type="checkbox" data-indeterminate="false" aria-label="Check E2E Hammer mv20ms2hgn" class="PrivateSwitchBase-input css-j8yymo"/>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - performing click action
    - click action done
    - waiting for scheduled navigations to finish
    - navigations have finished

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "Mealie" [ref=e5] [cursor=pointer]:
        - /url: /
      - link "Home" [ref=e6] [cursor=pointer]:
        - /url: /
      - paragraph [ref=e7]: E2E Admin
      - button "Settings" [ref=e8] [cursor=pointer]
      - button "Logout" [ref=e9] [cursor=pointer]
  - main [ref=e10]:
    - generic [ref=e12]:
      - heading "E2E Hardware Store" [level=1] [ref=e13]
      - generic [ref=e14]:
        - link "Shopping Lists" [ref=e15] [cursor=pointer]:
          - /url: /shopping-lists
        - button "Rename" [ref=e16] [cursor=pointer]
        - button "Delete List" [ref=e17] [cursor=pointer]
      - generic [ref=e18]:
        - generic [ref=e20]:
          - generic: Add item
          - generic [ref=e21]:
            - combobox "Add item" [ref=e22]
            - button "Open" [ref=e24] [cursor=pointer]
            - group [aria-hidden]:
              - generic: Add item
        - generic [ref=e27]:
          - generic: Note
          - generic [ref=e28]:
            - textbox "Note" [ref=e29]
            - group [aria-hidden]:
              - generic: Note
        - generic [ref=e30]:
          - generic [ref=e31]: Quantity
          - generic [ref=e32]:
            - spinbutton "Quantity" [ref=e33]: "1"
            - group [aria-hidden]:
              - generic: Quantity
        - button "Add" [ref=e34] [cursor=pointer]
      - paragraph [ref=e35]: One item checked
      - generic [ref=e37]:
        - checkbox "Check E2E Hammer mv20ms2hgn" [checked] [ref=e39] [cursor=pointer]
        - paragraph [ref=e42]: E2E Hammer mv20ms2hgn
        - button "Delete" [ref=e43] [cursor=pointer]
      - generic [ref=e44]:
        - generic [ref=e45]:
          - generic: Recipe
          - generic [ref=e46]:
            - combobox "Recipe" [ref=e47] [cursor=pointer]
            - textbox [aria-hidden]
            - group [aria-hidden]:
              - generic: Recipe
        - button "Add Recipe Ingredients" [disabled]
      - button "Delete Checked Items" [ref=e48] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { NAMES } from "../../lib/fixtures";
  3  | import { checkboxRowOf, openDialog, SUBMIT, uniqueName, visibleText } from "../../lib/ui";
  4  | 
  5  | test.describe("shopping lists", () => {
  6  |   test("[flow] create a shopping list", async ({ page }) => {
  7  |     const name = uniqueName("E2E Flow List");
  8  |     await page.goto("/shopping-lists");
  9  |     await expect(visibleText(page, NAMES.shoppingList)).toBeVisible();
  10 |     await page.getByRole("main").getByRole("button", { name: "Create", exact: true }).click();
  11 |     const dialog = openDialog(page);
  12 |     await dialog.getByRole("textbox", { name: "New List" }).fill(name);
  13 |     await dialog.getByRole("button", { name: SUBMIT }).click();
  14 |     await expect(page.getByRole("link", { name })).toBeVisible();
  15 |     await page.reload();
  16 |     await expect(page.getByRole("link", { name })).toBeVisible();
  17 |   });
  18 | 
  19 |   test("[flow] add an item and check it off", async ({ page }) => {
  20 |     const item = uniqueName("E2E Hammer");
  21 |     await page.goto("/shopping-lists?disableRedirect=true");
  22 |     await page.getByRole("link", { name: NAMES.shoppingList2 }).click();
  23 |     await expect(page.getByRole("heading", { name: NAMES.shoppingList2 })).toBeVisible();
  24 | 
  25 |     await page.waitForLoadState("networkidle");
  26 |     await page.getByRole("combobox", { name: "Add item" }).click({ force: true });
  27 |     const note = page.getByRole("main").getByRole("textbox", { name: "Note" });
  28 |     await note.fill(item);
  29 |     const created = page.waitForResponse(r => r.url().includes("/api/households/shopping/items")
  30 |       && r.request().method() === "POST" && r.ok());
  31 |     await note.press("Enter");
  32 |     const row = checkboxRowOf(page, item);
  33 |     await expect(row).toBeVisible();
  34 |     await created;
  35 | 
  36 |     // Checking is saved in the background; wait for the backend to accept it before reloading.
  37 |     const saved = page.waitForResponse(r => r.url().includes("/api/households/shopping/items")
  38 |       && ["PUT", "PATCH"].includes(r.request().method()) && r.ok());
> 39 |     await row.getByRole("checkbox").first().check();
     |                                             ^ Error: locator.check: Clicking the checkbox did not change its state
  40 |     await expect(visibleText(page, "One item checked")).toBeVisible();
  41 |     await saved;
  42 | 
  43 |     await page.reload();
  44 |     await expect(visibleText(page, "One item checked")).toBeVisible();
  45 |   });
  46 | });
  47 | 
```