import {notFound} from 'next/navigation';
import {Suspense} from 'react';
import {modules} from '@/lib/modules';
import {ResourceManager} from '@/components/resource-manager';
import {DocumentUploader} from '@/components/document-uploader';
import type {Resource} from '@/lib/rbac';
export default async function ResourcePage({params}:{params:Promise<{resource:string}>}){
 const {resource}=await params;
 const spec=modules[resource as Resource];
 if(!spec)notFound();
 return <div className="space-y-6">{resource==='documents'&&<DocumentUploader/>}<Suspense fallback={<p className="muted text-sm">Carregando módulo...</p>}><ResourceManager spec={spec}/></Suspense></div>;
}
