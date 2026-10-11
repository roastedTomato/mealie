Implemented independently from generated backend contracts and Vue API modules:
- Shopping list create/read/rename/delete; item add/edit/check/delete; recipe ingredient import.
- Seven-day meal plan view/edit, week navigation, dated notes/recipes/random entries, update/delete.
- Meal rules create/read/update/delete; public generated types remain unchanged.
- MUI accessible controls and react-i18next mapped English catalog labels; new labels fallback to English. Dynamic checked-count sentence, day/meal-type enum options, dialog conditional titles still English. Advanced label settings, shopping drag ordering, household meal defaults are not equivalent to Vue; acceptance yardstick does not cover them.

Private browser harness copied current main account pages/App/useText, used only for backend browser acceptance. Restored/deleted before delivery. No WF1 implementation inspected/reused. No commits. No merge conflict or shared file requests. Local rework: generated import relative depth; optimistic checkbox update needed to satisfy checkbox user interaction before backend response. Environment sandbox denied bind; isolated run retried with approved local browser permissions. No user action requested.

Acceptance before final freeze: generated strict TypeScript build/lint/unit pass; shopping and mealplan unchanged browser tests 3/3; owned strict routes 6/6. Unit tests verify date boundary and actual payloads for list/note creation. Successful browser runs seeded isolated SQLite data; deliberate setup login rejection is fixture behavior.
