'use client';
import {useMemo,useState} from 'react';
import {Download,Plus,Rows3,KanbanSquare,Table2,Trash2} from 'lucide-react';
export type GridData={columns:string[];rows:string[][];view?:'table'|'board'};
type Props={value:GridData;onChange:(next:GridData)=>void;readOnly?:boolean;database?:boolean};
const colName=(n:number)=>String.fromCharCode(65+n);
export function calculateCell(rows:string[][],r:number,c:number,visited=new Set<string>()):string{
 const raw=rows[r]?.[c]||'';
 if(!raw.startsWith('='))return raw;
 const token=r+':'+c;
 if(visited.has(token))return '#CYCLE';
 const seen=new Set(visited);seen.add(token);
 const toNum=(s:string)=>{const match=s.match(/^([A-Z])(\d{1,3})$/);
  if(match){const n=calculateCell(rows,Number(match[2])-1,match[1].charCodeAt(0)-65,seen);return Number(n.replace(',','.'))||0}
  return Number(s.replace(',','.'))||0};
 const sum=raw.match(/^=SUM\(([A-Z])(\d{1,3}):([A-Z])(\d{1,3})\)$/i);
 if(sum){let total=0;for(let i=Number(sum[2])-1;i<Number(sum[4]);i++)for(let j=sum[1].toUpperCase().charCodeAt(0)-65;j<=sum[3].toUpperCase().charCodeAt(0)-65;j++)total+=toNum(colName(j)+(i+1));return String(Math.round(total*1e6)/1e6)}
 const math=raw.match(/^=\s*([A-Z]\d{1,3}|-?\d+(?:[.,]\d+)?)\s*([+\-*/])\s*([A-Z]\d{1,3}|-?\d+(?:[.,]\d+)?)\s*$/i);
 if(math){const a=toNum(math[1].toUpperCase()),b=toNum(math[3].toUpperCase());if(math[2]==='/'&&b===0)return '#DIV/0';const v=math[2]==='+'?a+b:math[2]==='-'?a-b:math[2]==='*'?a*b:a/b;return String(Math.round(v*1e6)/1e6)}
 return '#FÓRMULA';
}
function toCSV(x:GridData){return [x.columns,...x.rows].map(row=>row.map(v=>'"'+v.replaceAll('"','""')+'"').join(';')).join('\r\n')}
export function WorkspaceSheet({value,onChange,readOnly=false,database=false}:Props){
 const [filter,setFilter]=useState('');const columns=value.columns;const rows=value.rows;const view=value.view||'table';
 const filtered=useMemo(()=>rows.map((row,i)=>({row,i})).filter(x=>x.row.join(' ').toLowerCase().includes(filter.toLowerCase())),[rows,filter]);
 function update(r:number,c:number,text:string){onChange({...value,rows:rows.map((row,i)=>i===r?row.map((v,j)=>j===c?text:v):row)})}
 function header(c:number,text:string){onChange({...value,columns:columns.map((v,i)=>i===c?text:v)})}
 function addCol(){if(columns.length>=30)return;onChange({...value,columns:[...columns,'Nova coluna'],rows:rows.map(row=>[...row,''])})}
 function addRow(){if(rows.length>=250)return;onChange({...value,rows:[...rows,columns.map(()=>'')]})}
 function removeRow(i:number){onChange({...value,rows:rows.filter((_,j)=>j!==i)})}
 function download(){const blob=new Blob(['\ufeff'+toCSV(value)],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='gato-planilha.csv';a.click();URL.revokeObjectURL(url)}
 const statusIndex=columns.findIndex(c=>/status|etapa|situaç/i.test(c));
 const statuses=Array.from(new Set(['A fazer','Em andamento','Concluído',...rows.map(r=>r[statusIndex]||'').filter(Boolean)]));
 return <div className="space-y-4">
  <div className="flex flex-wrap gap-2 items-center justify-between"><div className="flex flex-wrap gap-2 items-center">
   {database&&<div className="flex gap-1"><button className={'btn '+(view==='table'?'is-active':'')} onClick={()=>onChange({...value,view:'table'})}><Table2 size={15}/> Tabela</button><button className={'btn '+(view==='board'?'is-active':'')} onClick={()=>onChange({...value,view:'board'})}><KanbanSquare size={15}/> Kanban</button></div>}
   <input className="input !w-52" placeholder="Filtrar linhas..." aria-label="Filtrar linhas" value={filter} onChange={e=>setFilter(e.target.value)}/></div>
   <div className="flex flex-wrap gap-2">{!readOnly&&<><button className="btn" onClick={addRow} disabled={rows.length>=250}><Rows3 size={16}/> Linha</button><button className="btn" onClick={addCol} disabled={columns.length>=30}><Plus size={16}/> Coluna</button></>}<button className="btn" onClick={download}><Download size={16}/> CSV</button></div>
  </div>
  {view==='board'&&database&&statusIndex>=0?<div className="overflow-auto"><div className="flex gap-3 min-w-max">{statuses.map(status=><section className="workspace-board-col" key={status}><h3 className="font-semibold text-xs mb-3">{status} <span className="muted">{filtered.filter(({row})=>(row[statusIndex]||'A fazer')===status).length}</span></h3><div className="space-y-2">{filtered.filter(({row})=>(row[statusIndex]||'A fazer')===status).map(({row,i})=><article key={i} draggable={!readOnly} onDragStart={e=>e.dataTransfer.setData('text/plain',String(i))} className="workspace-board-card"><h4 className="font-semibold">{row[0]||'Sem título'}</h4><p className="muted text-xs mt-2">{row.filter((_,j)=>j!==0&&j!==statusIndex).filter(Boolean).join(' · ')||'Sem detalhes'}</p>{!readOnly&&<select className="input mt-2 !min-h-8" value={row[statusIndex]||'A fazer'} onChange={e=>update(i,statusIndex,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select>}</article>)}</div><div className="min-h-12" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const i=Number(e.dataTransfer.getData('text/plain'));if(!readOnly&&Number.isInteger(i)&&i>=0&&i<rows.length)update(i,statusIndex,status)}}/></section>)}</div></div>:
  <div className="workspace-grid-overflow"><table className="workspace-sheet"><thead><tr><th className="row-number">#</th>{columns.map((col,c)=><th key={c}><span className="muted text-[10px]">{colName(c)}</span><input aria-label={'Nome da coluna '+colName(c)} disabled={readOnly} value={col} onChange={e=>header(c,e.target.value)} /></th>)}{!readOnly&&<th className="row-number"> </th>}</tr></thead><tbody>{filtered.map(({row,i})=><tr key={i}><th className="row-number">{i+1}</th>{columns.map((_,c)=><td key={c}><input aria-label={colName(c)+(i+1)} value={row[c]||''} disabled={readOnly} onChange={e=>update(i,c,e.target.value)}/>{row[c]?.startsWith('=')&&<small className="sheet-result">{calculateCell(rows,i,c)}</small>}</td>)}{!readOnly&&<td><button className="btn !p-1 !min-h-7" title="Excluir linha" onClick={()=>removeRow(i)}><Trash2 size={14}/></button></td>}</tr>)}</tbody></table>{!rows.length&&<p className="muted p-6 text-sm">Planilha vazia. Adicione sua primeira linha.</p>}</div>}
  <p className="muted text-xs">Edição gravada automaticamente · Fórmulas suportadas: <code>=SUM(B1:B5)</code>, <code>=A1+B2</code>, <code>=A1*2</code>. CSV compatível com Excel.</p>
 </div>;
}
