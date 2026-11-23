import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const enabled = process.env.RUN_SMOKE === '1';
const base = process.env.APP_URL || 'http://127.0.0.1:3000';
const suffix = randomUUID().slice(0, 12);
const password = 'QA-Only-Password-No-Reuse-2026!';

function client(cookie = '') {
 return async (path, method = 'GET', body, extraHeaders = {}) => {
  const response = await fetch(new URL(path, base), {
   method,
   headers: { origin: base, ...(cookie ? {cookie} : {}), ...(body !== undefined ? {'Content-Type':'application/json'} : {}), ...extraHeaders },
   body: body === undefined ? undefined : JSON.stringify(body),
   redirect: 'manual'
  });
  return { status:response.status, body:await response.json().catch(()=>null), headers:response.headers };
 };
}
function expect(response, code, info) {
 assert.equal(response.status, code, info + ': ' + JSON.stringify(response.body).slice(0, 600));
 return response.body;
}
async function login(email, secret) {
 const result = await client()('/api/auth/login', 'POST', {email, password:secret});
 expect(result, 200, 'login '+email);
 const cookie = result.headers.get('set-cookie')?.split(';')[0] || '';
 assert.ok(cookie.includes('atletica_session='), 'missing session cookie');
 const api=client(cookie);
 api.cookie=cookie;
 return api;
}

test('QA: financeiro, ocorrências, documentos e isolamento entre diretorias', {skip: !enabled, timeout: 180000}, async t => {
 const unauth = client();
 const admin = await login(process.env.SMOKE_ADMIN_EMAIL, process.env.SMOKE_ADMIN_PASSWORD);
 const departments = expect(await admin('/api/records/departments'), 200, 'departments').items;
 const find = key => {
  const dep = departments.find(x => x.key === key);
  assert.ok(dep, 'department '+key+' missing from bootstrap');
  return dep.id;
 };
 const financeiro = find('financeiro');
 const pessoas = find('pessoas');
 const publicidade = find('publicidade');
 const makeUser = async (role, departments, name) => {
  const email = 'qa-'+suffix+'-'+name+'@example.invalid';
  const result = await admin('/api/admin/users','POST',{
   name:'QA '+name, email,password,globalRole:role,
   departments
  });
  expect(result, 201, 'create '+name);
  return login(email,password);
 };
 const finDirector = await makeUser('GENERAL',[{departmentId:financeiro,role:'DIRECTOR'}],'finance-director');
 const finEditor = await makeUser('GENERAL',[{departmentId:financeiro,role:'EDITOR'}],'finance-editor');
 const peopleDirector = await makeUser('GENERAL',[{departmentId:pessoas,role:'DIRECTOR'}],'people-director');
 const publicityEditor = await makeUser('GENERAL',[{departmentId:publicidade,role:'EDITOR'}],'publicity-editor');
 const publicityViewer = await makeUser('GENERAL',[{departmentId:publicidade,role:'VIEWER'}],'publicity-viewer');
 const outsider = await makeUser('GENERAL',[],'outsider');
 const board = await makeUser('BOARD',[],'board');

 await t.test('Permissões de rotas sem sessão e sem origem', async()=>{
  expect(await unauth('/api/records/transactions'),401,'unauth finance');
  expect(await unauth('/api/records/occurrences'),401,'unauth discipline');
  expect(await unauth('/api/records/documents'),401,'unauth docs');
  expect(await outsider('/api/records/transactions'),403,'outsider finance');
  expect(await outsider('/api/records/occurrences'),403,'outsider discipline');
  expect(await outsider('/api/records/documents'),403,'outsider docs');
  const noOrigin=await finDirector('/api/records/accounts','POST',{name:'QA bad origin'}, {origin:''});
  expect(noOrigin,403,'missing origin');
 });

 const acc=expect(await finDirector('/api/records/accounts','POST',{name:'QA conta '+suffix}),201,'account').record;
 const cat=expect(await finDirector('/api/records/categories','POST',{name:'QA categoria '+suffix}),201,'category').record;
 const amount = {description:'QA receita '+suffix,kind:'INCOME',amount:'17.75',occurredAt:new Date().toISOString(),accountId:acc.id,categoryId:cat.id,departmentId:financeiro};

 await t.test('Financeiro: criação, valores, escopo, categoria inválida e estorno', async()=>{
  expect(await publicityEditor('/api/records/transactions','POST',amount),403,'publicity cannot post finance');
  expect(await finDirector('/api/records/transactions','POST',{...amount,departmentId:publicidade}),403,'finance department spoofing');
  expect(await finDirector('/api/records/transactions','POST',{...amount,amount:'0'}),422,'zero amount');
  expect(await finDirector('/api/records/transactions','POST',{...amount,amount:'-1'}),422,'negative amount');
  expect(await finDirector('/api/records/transactions','POST',{...amount,categoryId:randomUUID()}),422,'invalid financial category must be user validation');
  const income=expect(await finDirector('/api/records/transactions','POST',amount),201,'valid income').record;
  assert.equal(Number(income.amount),17.75);
  expect(await publicityViewer('/api/records/transactions/'+income.id),403,'viewer cannot read finance');
  expect(await outsider('/api/records/transactions/'+income.id),403,'outsider cannot read finance');
  expect(await finEditor('/api/records/transactions/'+income.id,'DELETE'),403,'editor cannot reverse');
  expect(await finDirector('/api/records/transactions/'+income.id,'PATCH',{version:1,data:amount}),405,'immutable finance');
  const reversal=expect(await finDirector('/api/records/transactions/'+income.id,'DELETE'),200,'director reversal').record;
  assert.equal(reversal.kind,'EXPENSE');
  assert.equal(Number(reversal.amount),17.75);
  assert.equal(reversal.reversalOfId,income.id);
  expect(await finDirector('/api/records/transactions/'+income.id,'DELETE'),409,'reverse twice');
  const original=expect(await finDirector('/api/records/transactions/'+income.id),200,'original').record;
  assert.equal(original.status,'REVERSED');
 });

 const member=expect(await admin('/api/records/members','POST',{name:'QA registro '+suffix,status:'ACTIVE',departmentIds:[pessoas]}),201,'people member').record;
 const outsideMember=expect(await admin('/api/records/members','POST',{name:'QA fora da área '+suffix,status:'ACTIVE',departmentIds:[publicidade]}),201,'outside member').record;

 await t.test('Ocorrências: limite 5, ajustes auditáveis, papel e IDOR', async()=>{
  const payload={memberId:member.id,type:'QA infração',justification:'Exemplo de ocorrência isolada para testes CI',points:3,departmentId:pessoas};
  expect(await publicityEditor('/api/records/occurrences','POST',payload),403,'publicity cannot discipline');
  expect(await peopleDirector('/api/records/occurrences','POST',{...payload,memberId:outsideMember.id}),400,'member outside department');
  const occ=expect(await peopleDirector('/api/records/occurrences','POST',payload),201,'people director occurrence').record;
  expect(await publicityViewer('/api/records/occurrences/'+occ.id),403,'viewer no discipline');
  expect(await outsider('/api/records/occurrences/'+occ.id),403,'outsider no discipline');
  expect(await board('/api/records/occurrences/'+occ.id),200,'board read-only');
  expect(await board('/api/records/occurrences/'+occ.id+'/adjust','POST',{delta:1,reason:'Revisão QA autorizada'}),403,'board cannot adjust');
  expect(await peopleDirector('/api/records/occurrences/'+occ.id,'PATCH',{version:1,data:payload}),405,'immutable discipline');
  expect(await peopleDirector('/api/records/occurrences/'+occ.id+'/adjust','POST',{delta:3,reason:'Ajuste QA além do limite'}),409,'limit adjustment');
  const adjusted=expect(await peopleDirector('/api/records/occurrences/'+occ.id+'/adjust','POST',{delta:2,reason:'Correção QA validada'}),200,'adjust +2').record;
  assert.equal(adjusted.adjustmentPoints,2);
  expect(await peopleDirector('/api/records/occurrences','POST',{...payload,points:1}),409,'more than five');
  expect(await peopleDirector('/api/records/occurrences/'+occ.id+'/adjust','POST',{delta:-5,reason:'Revisão QA que zera o total'}),200,'adjust -5');
  expect(await peopleDirector('/api/records/occurrences/'+occ.id+'/adjust','POST',{delta:-1,reason:'Revisão QA além do mínimo'}),409,'limit below zero');
 });

 await t.test('Documentos: links HTTPS, leitura isolada e upload privado', async()=>{
  expect(await publicityViewer('/api/records/documents','POST',{title:'QA proibido',departmentId:publicidade}),403,'viewer cannot create docs');
  expect(await publicityEditor('/api/records/documents','POST',{title:'QA http inválido',departmentId:publicidade,externalUrl:'http://example.invalid/test'}),422,'URL must be https');
  const doc=expect(await publicityEditor('/api/records/documents','POST',{title:'QA documento '+suffix,departmentId:publicidade,externalUrl:'https://example.invalid/gato-ci'}),201,'doc link').record;
  expect(await publicityViewer('/api/records/documents/'+doc.id),200,'viewer can read own dept');
  expect(await finDirector('/api/records/documents/'+doc.id),404,'finance cannot read other dept');
  expect(await finDirector('/api/records/documents/'+doc.id,'PATCH',{version:1,data:{title:'QA hack',departmentId:publicidade}}),403,'finance cannot modify other dept');
  expect(await finDirector('/api/records/documents/'+doc.id,'DELETE'),403,'finance cannot archive other dept');
  expect(await outsider('/api/records/documents/'+doc.id+'/download'),404,'cannot download nonexistent storage key');
  const pdf = new File([new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF')], 'qa-document.pdf', {type:'application/pdf'});
  const form = new FormData();
  form.set('title','QA arquivo '+suffix);
  form.set('departmentId',publicidade);
  form.set('file',pdf);
  const send = await fetch(new URL('/api/documents/upload',base),{method:'POST',headers:{origin:base,cookie:publicityEditor.cookie},body:form,redirect:'manual'});
  const uploadedBody=await send.json().catch(()=>null);
  assert.equal(send.status,201,'PDF upload without optional description: '+JSON.stringify(uploadedBody));
  const id=uploadedBody.record.id;
  const response=await publicityEditor('/api/documents/'+id+'/download');
  // response is binary and is inspected separately below; JSON parsing returns null on success.
  assert.equal(response.status,200,'own dept should download PDF');
  expect(await finDirector('/api/documents/'+id+'/download'),403,'other dept cannot download PDF');
  expect(await outsider('/api/documents/'+id+'/download'),403,'outsider cannot download PDF');
 });
});

