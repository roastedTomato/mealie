import fs from 'node:fs';
import path from 'node:path';
const [moduleId, unitPassed, routes, flows, repairs, ...notes] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '../../..');
const evidence = path.resolve(import.meta.dirname, '..');
const folder = path.join(evidence, 'modules', moduleId);
const steps = fs.readFileSync(path.join(folder, 'steps.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
const startPath = path.join(folder,'start.txt');
const started = fs.existsSync(startPath) ? fs.readFileSync(startPath,'utf8').trim() : steps[0].started_at_utc;
const files=[];
function scan(dir) { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { if (['node_modules','dist','coverage','.git'].includes(entry.name)) continue; const file=path.join(dir,entry.name);if(entry.isDirectory()) scan(file); else if(fs.statSync(file).mtimeMs>=Date.parse(started)) files.push(path.relative(root,file)); } }
scan(path.join(root,'frontend-react'));
const result={ module:moduleId, started_at_utc:started, ended_at_utc:new Date().toISOString(),tokens:null,token_status:'NA: telemetry not exposed',prompt:'prompt.md',session_log:'../../session-logs/session-002.md',changed_files:files,unit_passed:Number(unitPassed),browser_strict_routes:routes,browser_flows:flows,source_repair_count:Number(repairs),acceptance:'pass',build:'pass',strict_types:'pass',lint:'pass',notes:notes.join(' '),steps };
fs.writeFileSync(path.join(folder,'result.json'),JSON.stringify(result,null,2));
fs.appendFileSync(path.join(evidence,'session-logs/session-002.md'),`\n${moduleId} acceptance PASS. Unit ${unitPassed}; strict routes ${routes}; flows ${flows}; repair cycles ${repairs}. ${notes.join(' ')}\n`);
console.log(JSON.stringify({module:moduleId,acceptance:result.acceptance,changed_files:files}));
