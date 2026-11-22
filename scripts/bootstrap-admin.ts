import 'dotenv/config';
import {prisma} from '../src/lib/prisma';
import {hashPassword,normalizeEmail} from '../src/lib/auth';
const units=[
 ['diretoria','Diretoria'],['pessoas','Gestão de Pessoas'],['eventos','Eventos'],['publicidade','Publicidade'],['financeiro','Financeiro'],['esports','eSports'],['dge','DGE']
];
async function main(){
  for(const [key,name] of units)await prisma.department.upsert({where:{key},update:{name},create:{key,name}});
  for(const name of ['Eventos','Uniformes','Material esportivo','Publicidade','Manutenção','Patrocínio','Inscrições','Transporte','Alimentação','Outras'])await prisma.financialCategory.upsert({where:{name},create:{name},update:{}});
  const email=process.env.ADMIN_EMAIL;const password=process.env.ADMIN_PASSWORD;
  if(!email||!password||password.length<16||password==='REPLACE_WITH_LONG_RANDOM_PASSWORD')throw Error('Configure ADMIN_EMAIL e uma ADMIN_PASSWORD exclusiva (mínimo 16 caracteres).');
  const normalized=normalizeEmail(email);
  const existing=await prisma.user.findUnique({where:{email:normalized}});
  if(existing){console.log('Administrador já existe; senha preservada, nenhum reset realizado.');return;}
  await prisma.user.create({data:{name:process.env.ADMIN_NAME||'Administrador',email:normalized,passwordHash:await hashPassword(password),globalRole:'ADMIN'}});
  console.log('Conta administrativa criada. Guarde as credenciais em cofre seguro.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>prisma.$disconnect());
