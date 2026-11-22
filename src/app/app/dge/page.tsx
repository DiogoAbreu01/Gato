import Link from 'next/link';
import {notFound} from 'next/navigation';
import {FolderKanban,CheckCircle2,FileText,ArrowUpRight} from 'lucide-react';
import {getSession} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {can} from '@/lib/rbac';
export default async function DgePage(){
 const session=await getSession();if(!session)notFound();
 const dept=await prisma.department.findUnique({where:{key:'dge'}});if(!dept)notFound();
 const actor={id:session.user.id,globalRole:session.user.globalRole,departments:session.user.departments.map(d=>({...d,key:d.department.key}))};
 if(!can(actor,'projects','read',dept.id)&&!can(actor,'tasks','read',dept.id))notFound();
 const [projects,tasks,documents]=await Promise.all([
  can(actor,'projects','read',dept.id)?prisma.project.findMany({where:{departmentId:dept.id,archivedAt:null},orderBy:{createdAt:'desc'},take:10}):[],
  can(actor,'tasks','read',dept.id)?prisma.task.findMany({where:{departmentId:dept.id,archivedAt:null},orderBy:{createdAt:'desc'},take:10}):[],
  can(actor,'documents','read',dept.id)?prisma.document.findMany({where:{departmentId:dept.id,archivedAt:null},orderBy:{createdAt:'desc'},take:10}):[]
 ]);
 const sections=[{name:'Projetos',icon:FolderKanban,records:projects.map(x=>({id:x.id,label:x.title,note:x.status})),href:'projects'},{name:'Tarefas',icon:CheckCircle2,records:tasks.map(x=>({id:x.id,label:x.title,note:x.status})),href:'tasks'},{name:'Documentos',icon:FileText,records:documents.map(x=>({id:x.id,label:x.title,note:x.description||'Documento'})),href:'documents'}];
 return <div className="space-y-7"><div><p className="muted uppercase text-xs font-bold tracking-[.15em] mb-2">Diretoria</p><h1 className="text-4xl font-bold">DGE</h1><p className="muted text-sm mt-2">Projetos, demandas e arquivos desta diretoria, reunidos num só espaço.</p></div><div className="grid grid-cols-1 xl:grid-cols-3 gap-4">{sections.map(s=><section key={s.href} className="panel p-5"><div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2"><s.icon size={18} style={{color:'var(--accent)'}}/><h2 className="font-bold">{s.name}</h2></div><span className="tag">{s.records.length}</span></div>{s.records.length?s.records.map(item=><Link key={item.id} href={`/app/${s.href}?open=${item.id}`} className="block py-3 border-t" style={{borderColor:'var(--edge)'}}><p className="text-sm font-semibold truncate">{item.label}</p><p className="muted text-xs mt-1 truncate">{item.note}</p></Link>):<p className="muted text-sm">Nenhum registro disponível.</p>}<Link href={`/app/${s.href}`} className="flex items-center gap-2 font-bold text-sm mt-5" style={{color:'var(--accent)'}}>Abrir {s.name.toLowerCase()} <ArrowUpRight size={15}/></Link></section>)}</div></div>;
}
