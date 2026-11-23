import {notFound,redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {hasWorkspaceAccess} from '@/lib/workspace';
import {WorkspaceExplorer} from '@/components/workspace-explorer';
export default async function Space({params}:{params:Promise<{departmentId:string}>}){
 const session=await getSession();if(!session)redirect('/login');
 const {departmentId}=await params;
 const actor={id:session.user.id,globalRole:session.user.globalRole,departments:session.user.departments.map(d=>({...d,key:d.department.key}))};
 if(!hasWorkspaceAccess(actor,departmentId,'read'))notFound();
 const dep=await prisma.department.findUnique({where:{id:departmentId}});if(!dep||!dep.active)notFound();
 return <WorkspaceExplorer departmentId={dep.id} departmentName={dep.name} canWrite={hasWorkspaceAccess(actor,dep.id,'write')}/>;
}