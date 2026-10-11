from pathlib import Path
import yaml
for filename in ['Taskfile.yml','.github/workflows/test-frontend.yml','.github/workflows/build-package.yml','.github/workflows/release.yml']:
 parsed=yaml.safe_load(Path(filename).read_text());assert isinstance(parsed,dict),filename
 print(filename+': YAML parses')
tasks=yaml.safe_load(Path('Taskfile.yml').read_text())['tasks']
assert tasks['ui:generate']['cmds']==['pnpm build']
assert tasks['ui:typecheck']['cmds']==['pnpm typecheck']
assert tasks['ui']['dir']=='frontend-react'
assert 'ui:typecheck' in tasks['ui:check']['deps']
text=Path('docker/Dockerfile').read_text()
assert 'COPY --from=frontend-builder /app/frontend-react/dist ./mealie/frontend' in text
assert 'COPY frontend/app/lib/api/types /app/frontend/app/lib/api/types' in text
assert 'COPY frontend/app/lang/messages /app/frontend/app/lang/messages' in text
for f in ['.github/workflows/test-frontend.yml','.github/workflows/build-package.yml']:
 assert 'working-directory: "frontend"' not in Path(f).read_text()
print('React task, package, Docker input/output and shared contract paths validated; runtime image/hosted CI not exercised')
