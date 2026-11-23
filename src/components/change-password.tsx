'use client';
import {useState} from 'react';
import {KeyRound,ShieldCheck,Eye,EyeOff} from 'lucide-react';
export function ChangePassword(){
 const [current,setCurrent]=useState('');const [next,setNext]=useState('');const [confirm,setConfirm]=useState('');const [show,setShow]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function save(e:React.FormEvent){e.preventDefault();setError('');
  if(next.length<16){setError('Escolha uma senha de pelo menos 16 caracteres.');return}
  if(next!==confirm){setError('As senhas não conferem.');return}
  setBusy(true);try{const r=await fetch('/api/auth/password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({currentPassword:current,newPassword:next})});const x=await r.json();if(!r.ok)throw Error(x.error||'Não foi possível alterar');setCurrent('');setNext('');setConfirm('');window.location.assign('/login')}catch(e){setError(e instanceof Error?e.message:'Erro inesperado')}finally{setBusy(false)}}
 return <form onSubmit={save} className="panel p-6 md:p-8 max-w-2xl space-y-5"><div className="flex gap-3 items-center"><div className="workspace-kind-icon !w-12 !h-12"><KeyRound size={22}/></div><div><h2 className="font-bold text-lg">Alterar senha</h2><p className="muted text-xs">Proteja sua conta com uma senha exclusiva.</p></div></div>
  <label className="block"><span className="label">Senha atual</span><input className="input" type={show?'text':'password'} autoComplete="current-password" value={current} onChange={e=>setCurrent(e.target.value)} required/></label>
  <label className="block"><span className="label">Nova senha</span><input className="input" type={show?'text':'password'} autoComplete="new-password" minLength={16} maxLength={128} value={next} onChange={e=>setNext(e.target.value)} required/><p className="muted mt-2 text-xs">Mínimo 16 caracteres. Use uma senha exclusiva, preferencialmente gerada por um gerenciador.</p></label>
  <label className="block"><span className="label">Confirmar nova senha</span><input className="input" type={show?'text':'password'} autoComplete="new-password" minLength={16} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>
  <label className="flex gap-2 items-center text-xs muted"><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/>{show?<EyeOff size={16}/>:<Eye size={16}/>} Mostrar senhas temporariamente</label>
  {error&&<p role="alert" className="text-sm" style={{color:'var(--danger)'}}>{error}</p>}
  <div className="flex gap-3 items-start rounded-xl p-3" style={{background:'var(--soft)'}}><ShieldCheck className="moon-accent" size={19}/><p className="text-xs muted flex-1">Ao atualizar sua senha, todas as sessões serão encerradas. Você entrará novamente usando a senha nova. Nenhuma senha é registrada na auditoria.</p></div>
  <button className="btn btn-primary" type="submit" disabled={busy||!current||next.length<16||!confirm}>{busy?'Atualizando...':'Salvar nova senha'}</button>
 </form>
}
