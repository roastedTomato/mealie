"""Export only operational metadata from this task and its two worker rollouts.
No model reasoning, credentials, system prompts, account IDs or other chats exported.
"""
from pathlib import Path
from datetime import datetime,timezone
import json
root=Path(__file__).resolve().parents[1]
rollouts=Path('/Users/eva/.codex/sessions/2026/10/11')
ids={'main':'01a128a3-12ca-7d33-8cb0-723b3ef29d02','recipes':'01a128a9-cfc6-7761-9b3b-b9d0095e15cc','planning':'01a128a9-f51b-7572-b7a0-e6076727e6a7'}
def dt(s):return datetime.fromisoformat(s.replace('Z','+00:00'))
rows={}
for owner,id in ids.items():
 paths=list(rollouts.glob('*'+id+'.jsonl'));assert len(paths)==1
 rows[owner]=[json.loads(line) for line in paths[0].read_text().splitlines() if line.strip()]
root_turn_ids={r['payload'].get('turn_id') for r in rows['main'] if r['type']=='event_msg' and r.get('payload',{}).get('type')=='task_started'}
now='2026-10-11T02:11:00.985780+00:00'
scope_start='2026-10-11T01:49:33.388Z'
implementation_turn='01a128a6-a947-7553-870d-d9d985723aad'
summary={'snapshot_utc':now,'scope':'WF2 implementation from completion authorization plus exactly two implementation agents; earlier preparation excluded','agents':{},'note':'Input counts include repeated cached context. cached_input_tokens is a subset of input_tokens; reasoning_output_tokens is a subset of output_tokens. Counts exclude work after each token telemetry checkpoint and final user reply.'}
for owner,events in rows.items():
 out=[];usage=[];pending={};windows=[];model=None;baseline={}
 for r in events:
  payload=r.get('payload',{});typ=payload.get('type');time=r['timestamp']
  if dt(time)>dt(now):continue
  if dt(time)<dt(scope_start):
   if owner=='main' and r['type']=='event_msg' and typ=='token_count' and payload.get('info'):baseline=payload['info']['total_token_usage']
   continue
  if r['type']=='turn_context':model=payload.get('model',model)
  if r['type']=='event_msg' and typ in ['task_started','task_complete']:
   turn=payload.get('turn_id')
   if owner=='main' and turn!=implementation_turn:continue
   if owner!='main' and turn in root_turn_ids:continue
   out.append({'time':time,'type':typ,'turn_id':turn})
   if typ=='task_started':pending[turn]=time
   elif turn in pending:
    start=pending.pop(turn);windows.append({'start':start,'end':time,'seconds':(dt(time)-dt(start)).total_seconds()})
  elif r['type']=='event_msg' and typ=='token_count' and payload.get('info'):
   entry={'time':time,'type':'token_count','usage':payload['info']['total_token_usage']};usage.append(entry);out.append(entry)
  elif r['type']=='response_item' and typ in ['function_call','custom_tool_call']:
   out.append({'time':time,'type':'tool_call','name':payload.get('name'),'call_id':payload.get('call_id')})
 for turn,start in pending.items():windows.append({'start':start,'end':now,'seconds':(dt(now)-dt(start)).total_seconds(),'open_at_snapshot':True})
 last=usage[-1]
 if owner=='main':
  last['usage']={k:v-baseline.get(k,0) for k,v in last['usage'].items()}
 dest=root/'agents'/owner/'platform-events.jsonl';dest.write_text(''.join(json.dumps(x)+'\n' for x in out))
 summary['agents'][owner]={'session_id':ids[owner],'model':model,'active_windows':windows,'active_seconds':sum(w['seconds'] for w in windows),'token_checkpoint':last['time'],'tokens':last['usage'],'pre_scope_token_baseline':baseline}
 if owner!='main':
  p=root/'agents'/owner/'metadata.json';meta=json.loads(p.read_text());meta['telemetry_recovered']=True;meta['authoritative_start_utc']=windows[0]['start'];meta['authoritative_end_utc']=windows[-1]['end'];meta['active_windows']=windows;meta['active_seconds']=sum(w['seconds'] for w in windows);meta['token_usage']=last['usage'];meta['model']=model;meta['telemetry_note']='Recovered from this agent local platform rollout; original observed timestamps and missing-data notes retained as historical record, superseded by these authoritative fields.';p.write_text(json.dumps(meta,indent=2)+'\n')
summary['total_active_seconds']=sum(a['active_seconds'] for a in summary['agents'].values())
summary['aggregate_tokens']={key:sum(a['tokens'].get(key,0) for a in summary['agents'].values()) for key in summary['agents']['main']['tokens']}
summary['aggregate_uncached_input_plus_output']=summary['aggregate_tokens']['input_tokens']-summary['aggregate_tokens']['cached_input_tokens']+summary['aggregate_tokens']['output_tokens']
summary['workflow_start_utc']=summary['agents']['main']['active_windows'][0]['start']
summary['implementation_start_utc']=summary['agents']['main']['active_windows'][-1]['start']
summary['workflow_elapsed_seconds']=(dt(now)-dt(summary['workflow_start_utc'])).total_seconds()
summary['implementation_elapsed_seconds']=(dt(now)-dt(summary['implementation_start_utc'])).total_seconds()
(root/'final/telemetry.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k not in ['agents','note']},indent=2))
