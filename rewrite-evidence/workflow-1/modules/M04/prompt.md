Agent-derived from continued Workflow 1: migrate recipe browsing/search, detail, shared view,
create-by-name, import URL/AI/HTML/ZIP/bulk/debug, comments and edit/delete/favorite/share controls.
Use actual backend endpoints and preserve generated models. Acceptance: unchanged recipes flows,
related strict routes (recipe root/list/detail/shared and creation/import pages), auth regression,
all React unit regression, strict types, lint, build. Import UI must submit actual requests and
handle streamed done/error/progress, even though external scraper/AI results are not covered by
local yardstick. Record limitations rather than claiming comprehensive behavioral equivalence.
