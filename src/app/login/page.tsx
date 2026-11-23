import Image from 'next/image';
import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {LoginForm} from '@/components/login-form';
export default async function LoginPage(){
 if(await getSession())redirect('/app');
 return <main className="min-h-screen grid lg:grid-cols-[1.1fr_.9fr]" style={{background:'var(--page)'}}>
  <section className="hidden lg:flex p-16 flex-col justify-between relative overflow-hidden" style={{background:'radial-gradient(circle at 55% 45%,#44446d55,transparent 42%),#0d0d18',borderRight:'1px solid #33334e'}}>
   <div className="flex items-center gap-3"><Image src="/gato-lunar.svg" width={56} height={56} alt="Mascote Gato Lunar"/><div><h1 className="font-black text-2xl text-white tracking-tight">Gato<span style={{color:'#b5b8fa'}}>.</span></h1><p className="text-xs text-[#b8b9d0]">Seu universo de ideias</p></div></div>
   <div className="relative z-10"><p className="text-xs tracking-[.25em] text-[#b9baf4] uppercase font-bold mb-6">Bem-vindo ao workspace da Atlética</p><h2 className="text-5xl 2xl:text-6xl font-extrabold tracking-[-.06em] leading-tight text-white max-w-2xl">Ideias grandes merecem <span style={{color:'#b5b8fa'}}>um universo próprio.</span></h2><p className="text-[#b6b6cb] mt-6 text-base leading-relaxed max-w-lg">Tudo da sua equipe em um só lugar. Páginas, projetos, planilhas, fluxogramas e decisões — organizados sob a mesma lua.</p></div>
   <div className="flex gap-3 items-center text-[#898ca7] text-xs"><span>✦</span> Gato Moon Workspace · 2026</div>
   <div className="pointer-events-none absolute w-[550px] h-[550px] rounded-full border border-[#a1a2ff22] -right-40 top-12"/><div className="pointer-events-none absolute w-[390px] h-[390px] rounded-full border border-[#a1a2ff26] -right-20 top-32"/>
  </section>
  <section className="flex justify-center items-center p-5 md:p-12"><div className="w-full max-w-md"><div className="flex items-center gap-3 mb-14 lg:mb-20"><Image src="/gato-lunar.svg" width={47} height={47} alt="Gatinho de óculos"/><div><strong className="text-xl tracking-tight">Gato</strong><p className="muted text-xs">Seu universo de ideias</p></div></div><p className="eyebrow">Acesso ao workspace</p><h2 className="text-4xl font-extrabold tracking-tight mb-2">Que bom te ver ☾</h2><p className="muted text-sm mb-9">Entre com sua conta para continuar de onde parou.</p><LoginForm/><p className="text-xs muted mt-9">Ambiente privado · Acesso autorizado · Dados protegidos</p></div></section>
 </main>
}