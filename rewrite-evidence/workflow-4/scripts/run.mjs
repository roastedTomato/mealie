import {spawn} from 'node:child_process';
import {mkdirSync,appendFileSync,createWriteStream} from 'node:fs';
import {resolve} from 'node:path';
const [owner,name,cwd,...command]=process.argv.slice(2);
const root=resolve(import.meta.dirname,'..');const dir=resolve(root,'agents',owner,'tests');mkdirSync(dir,{recursive:true});const output=resolve(dir,name+'.log');const log=createWriteStream(output);const start=new Date();
const child=spawn(command[0],command.slice(1),{cwd,env:process.env,stdio:['ignore','pipe','pipe']});child.stdout.pipe(log);child.stderr.pipe(log);child.on('error',e=>log.write(String(e)));child.on('close',(code)=>{log.end();appendFileSync(resolve(root,'agents',owner,'session.jsonl'),JSON.stringify({name,cwd,command,start:start.toISOString(),end:new Date().toISOString(),seconds:(Date.now()-start.getTime())/1000,exit:code,output,tokens:null})+'\n');console.log(JSON.stringify({name,exit:code,output}));process.exitCode=code??1;});
