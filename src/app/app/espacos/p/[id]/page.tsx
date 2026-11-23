import {WorkspaceEditor} from '@/components/workspace-editor';
export default async function WorkspacePage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <WorkspaceEditor id={id}/>;}
