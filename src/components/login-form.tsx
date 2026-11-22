'use client';
import {useState} from 'react';
import {ArrowRight, LoaderCircle} from 'lucide-react';
export function LoginForm(){
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});if(!r.ok){const x=await r.json();throw new Error(x.error||'Não foi possível entrar');}window.location.assign('/app');}catch(e){setError(e instanceof Error?e.message:'Erro inesperado');}finally{setBusy(false)}}
 return <form onSubmit={submit} className="grid gap-5"><label><span className="label">E-mail</span><input className="input" autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label><span className="label">Senha</span><input className="input" autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy?<LoaderCircle className="animate-spin" size={16}/>:<>Entrar no sistema <ArrowRight size={16}/></>}</button></form>
}
