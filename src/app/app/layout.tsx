import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {Navigation} from '@/components/navigation';
import {ALL_RESOURCES,can} from '@/lib/rbac';
export default async function AppLayout({children}:{children:React.ReactNode}){
 const session=await getSession();if(!session)redirect('/login');
 const actor={id:session.user.id,globalRole:session.user.globalRole,departments:session.user.departments.map(d=>({...d,key:d.department.key}))};
 const access=[...ALL_RESOURCES.filter(resource=>can(actor,resource,'read')),...(session.user.globalRole!=='GENERAL'||session.user.departments.some(d=>d.department.key==='dge')?['dge']:[])];
 return <div className="app-shell"><Navigation name={session.user.name} role={session.user.globalRole} access={access}/><div className="shell-content"><main className="main">{children}</main></div></div>;
}
