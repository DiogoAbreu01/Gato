import {z} from 'zod';
import type {Actor} from '@/lib/rbac';

export const pageKinds=['PAGE','SHEET','FLOW','DATABASE'] as const;
export const blockSchema=z.object({
  id:z.string().uuid(),
  type:z.enum(['paragraph','heading','todo','bullet','quote','divider','link']),
  text:z.string().max(12000).default(''),
  checked:z.boolean().optional()
}).strict();
export const pageCreateSchema=z.object({
  departmentId:z.string().uuid(),
  parentId:z.string().uuid().nullable().optional(),
  title:z.string().trim().min(1).max(160).default('Sem título'),
  icon:z.string().max(8).optional(),
  kind:z.enum(pageKinds).default('PAGE')
}).strict();
export const pageUpdateSchema=z.object({
  version:z.number().int().min(1),
  title:z.string().trim().min(1).max(160).optional(),
  icon:z.string().max(8).optional(),
  content:z.array(blockSchema).max(400).optional(),
  data:z.record(z.unknown()).optional()
}).strict();
export const pageDataLimit=160000;
export function hasWorkspaceAccess(actor:Actor,departmentId:string,verb:'read'|'write'){
  if(actor.globalRole==='ADMIN'||actor.globalRole==='BOARD')return true;
  return actor.departments.some(d=>d.departmentId===departmentId && (verb==='read'||d.role==='DIRECTOR'||d.role==='EDITOR'));
}
export function pageDataValid(kind:string,data:unknown):boolean{
 if(!data||typeof data!=='object'||Array.isArray(data))return false;
 if(JSON.stringify(data).length>pageDataLimit)return false;
 const x=data as Record<string,unknown>;
 if(kind==='SHEET'||kind==='DATABASE'){
  return Array.isArray(x.rows)&&x.rows.length<=250&&x.rows.every(row=>Array.isArray(row)&&row.length<=30&&row.every(cell=>typeof cell==='string'&&cell.length<=1000))
   && Array.isArray(x.columns)&&x.columns.length<=30&&x.columns.every(v=>typeof v==='string'&&v.length<=80)
   && (x.view===undefined||['table','board'].includes(String(x.view)));
 }
 if(kind==='FLOW'){
  return Array.isArray(x.nodes)&&x.nodes.length<=80&&x.nodes.every(n=>n&&typeof n==='object'&&!Array.isArray(n)&&typeof n.id==='string'&&n.id.length<=80&&typeof n.label==='string'&&n.label.length<=120&&typeof n.x==='number'&&Number.isFinite(n.x)&&typeof n.y==='number'&&Number.isFinite(n.y)&&Math.abs(n.x)<5000&&Math.abs(n.y)<5000)
   && Array.isArray(x.edges)&&x.edges.length<=150&&x.edges.every(e=>e&&typeof e==='object'&&typeof e.id==='string'&&typeof e.source==='string'&&typeof e.target==='string');
 }
 return kind==='PAGE'&&Object.keys(x).length===0;
}
export function defaultPageData(kind:string){
 if(kind==='SHEET')return {columns:['Nome','Valor','Observações'],rows:[['','',''],['','','']],view:'table'};
 if(kind==='DATABASE')return {columns:['Nome','Status','Responsável'],rows:[['Novo item','A fazer','']],view:'table'};
 if(kind==='FLOW')return {nodes:[{id:'inicio',label:'Início',x:100,y:80}],edges:[]};
 return {};
}
