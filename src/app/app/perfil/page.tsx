import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {ChangePassword} from '@/components/change-password';
export default async function Profile(){
 const session=await getSession();if(!session)redirect('/login');
 return <div className="space-y-7"><header><p className="eyebrow">Gato / Minha conta</p><h1 className="text-3xl md:text-4xl font-bold tracking-tight">Meu perfil ☾</h1><p className="muted mt-2">Segurança, identidade e acesso ao workspace.</p></header>
  <section className="panel p-6 max-w-2xl"><p className="label">Nome</p><p className="font-semibold">{session.user.name}</p><div className="mt-5"><p className="label">E-mail</p><p className="text-sm">{session.user.email}</p></div><div className="mt-5"><p className="label">Permissão global</p><span className="tag">{session.user.globalRole==='ADMIN'?'Administrador':session.user.globalRole==='BOARD'?'Diretoria':'Membro'}</span></div></section>
  <ChangePassword/>
 </div>;
}
