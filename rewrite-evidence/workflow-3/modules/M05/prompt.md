M05: migrate organizer browsing/filtering, cookbooks and recipe finder/timeline. The organize
flow creates a tag through /group/data/tags; move the shared organizer CRUD table boundary here,
then reuse it for M09 data management. Acceptance: organizers/cookbooks/finder/timeline strict
routes + organize flow + prior auth/recipes flows + React unit regression/strict/build/lint.
Real data and working mutations required; do not substitute seeded text or static test fixtures.
