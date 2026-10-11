M10: audit deployment/default frontend integration, locale loading/navigation and session edges;
format React source for review; run all units, strict/lint/build and full unchanged E2E.
Then run the original measure.sh four times against frontend-react for core/extended × smoke/strict,
without baseline or commits. Populate actual metrics and final evidence report. Do not claim
Docker image build if Docker daemon unavailable. Preserve generated types, non-English locale
files and independent yardstick. Record incomplete telemetry and feature/visual parity limits.
