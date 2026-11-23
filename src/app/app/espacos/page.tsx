import Link from 'next/link';
import {getSession} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {redirect} from 'next/navigation';
import {ArrowUpRight,BookOpen,FolderOpen,GitBranch,Table2} from 'lucide-react';
export default async function Spaces(){
 const session=await getSession();if(!session)redirect('/login');
 const admin=session.user.globalRole==='ADMIN'||session.user.globalRole==='BOARD';
 const ids=session.user.departments.map(d=>d.departmentId);
 const areas=await prisma.department.findMany({where:{active:true,...(!admin?{id:{in:ids}}:{})},orderBy:{name:'asc'},select:{id:true,name:true,key:true,_count:{select:{workspacePages:{where:{archivedAt:null}}}}}});
 const icons:Record<string,string>={diretoria:'☾',pessoas:'✦',eventos:'◈',publicidade:'◉',financeiro:'◇',esports:'✧',dge:'☼'};
 return <div className="space-y-7"><header><p className="eyebrow">Gato Workspace / Sua Atlética</p><h1 className="text-3xl md:text-4xl font-bold tracking-tight">Seus espaços de trabalho <span className="moon-accent">✦</span></h1><p className="muted text-sm mt-3 max-w-2xl">Organize o conhecimento da Atlética em um só lugar: páginas, bases de dados, planilhas e fluxogramas.</p></header><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{areas.map(area=><Link key={area.id} href={'/app/espacos/'+area.id} className="workspace-space-card panel"><span className="workspace-space-icon">{icons[area.key]||'☾'}</span><div><h2 className="font-bold text-lg">{area.name}</h2><p className="muted text-xs mt-1">{area._count.workspacePages} páginas e recursos</p></div><ArrowUpRight className="ml-auto moon-accent" size={20}/></Link>)}</div>{!areas.length&&<div className="panel p-8 muted">Nenhuma diretoria atribuída ao seu perfil. Um administrador pode liberar o acesso em Usuários e acessos.</div>}<div className="panel p-6"><h2 className="font-semibold mb-3">Crie do seu jeito</h2><div className="grid sm:grid-cols-3 gap-4 muted text-sm"><p className="flex items-center gap-2"><BookOpen size={18} className="moon-accent"/> Páginas e subtópicos</p><p className="flex items-center gap-2"><Table2 size={18} className="moon-accent"/> Planilhas e Kanban</p><p className="flex items-center gap-2"><GitBranch size={18} className="moon-accent"/> Fluxogramas e processos</p></div></div></div>
}