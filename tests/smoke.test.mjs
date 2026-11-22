import test from 'node:test';
import assert from 'node:assert/strict';
const enabled=process.env.RUN_SMOKE==='1';
const base=process.env.APP_URL||'http://127.0.0.1:3000';
let cookie='';
async function request(path,method='GET',data){
 const res=await fetch(new URL(path,base),{method,headers:{origin:base,cookie,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,redirect:'manual'});
 const value=await res.json().catch(()=>null);
 return {status:res.status,body:value,headers:res.headers};
}
test('integração real: login, criar, editar e histórico de concorrência', {skip:!enabled},async()=>{
 const health=await request('/api/health');assert.equal(health.status,200);
 const login=await request('/api/auth/login','POST',{email:process.env.SMOKE_ADMIN_EMAIL,password:process.env.SMOKE_ADMIN_PASSWORD});
 assert.equal(login.status,200,JSON.stringify(login.body));
 cookie=login.headers.get('set-cookie')?.split(';')[0]||'';assert.ok(cookie.includes('atletica_session='));
 const deps=await request('/api/records/departments');assert.equal(deps.status,200);const dept=deps.body.items[0];assert.ok(dept?.id);
 const newM=await request('/api/records/members','POST',{name:'Membro temporário CI',status:'ACTIVE',departmentIds:[dept.id]});assert.equal(newM.status,201,JSON.stringify(newM.body));
 const id=newM.body.record.id;
 const m=await request(`/api/records/members/${id}`);assert.equal(m.status,200);
 const v=m.body.record.version;
 const revised=await request(`/api/records/members/${id}`,'PATCH',{version:v,data:{name:'Membro CI revisado',status:'AWAY',departmentIds:[dept.id]}});assert.equal(revised.status,200,JSON.stringify(revised.body));
 const conflicting=await request(`/api/records/members/${id}`,'PATCH',{version:v,data:{name:'Conflito de versão',status:'ACTIVE',departmentIds:[dept.id]}});assert.equal(conflicting.status,409);
 const ev=await request('/api/records/events','POST',{name:'Evento de teste CI',startsAt:new Date(Date.now()+86400000).toISOString(),status:'PLANNING',departmentId:dept.id});assert.equal(ev.status,201,JSON.stringify(ev.body));
 const tk=await request('/api/records/tasks','POST',{title:'Tarefa integração CI',status:'TODO',priority:2,departmentId:dept.id,eventId:ev.body.record.id});assert.equal(tk.status,201,JSON.stringify(tk.body));
 const calendar=await request('/api/calendar');assert.equal(calendar.status,200);assert.ok(calendar.body.items.some(x=>x.id===ev.body.record.id));
 const accountResponse=await request('/api/records/accounts','POST',{name:'Conta de teste CI'});assert.equal(accountResponse.status,201,JSON.stringify(accountResponse.body));const account=accountResponse.body.record;
 const money=await request('/api/records/transactions','POST',{description:'Receita integração CI',kind:'INCOME',amount:'19.90',occurredAt:new Date().toISOString(),accountId:account.id,departmentId:dept.id});assert.equal(money.status,201,JSON.stringify(money.body));
 const reversed=await request(`/api/records/transactions/${money.body.record.id}`,'DELETE');assert.equal(reversed.status,200,JSON.stringify(reversed.body));assert.equal(reversed.body.record.kind,'EXPENSE');
 const twice=await request(`/api/records/transactions/${money.body.record.id}`,'DELETE');assert.equal(twice.status,409);
 const unauthorized=await fetch(new URL('/api/records/transactions',base));assert.equal(unauthorized.status,401);
 const regularEmail=`gato-ci-${Date.now()}@example.invalid`;
 const regularPassword='CI-Temporary-Password-2026-XYZ';
 const regular=await request('/api/admin/users','POST',{name:'Membro Geral CI',email:regularEmail,password:regularPassword,globalRole:'GENERAL',departments:[]});assert.equal(regular.status,201,JSON.stringify(regular.body));
 const regularLogin=await request('/api/auth/login','POST',{email:regularEmail,password:regularPassword});assert.equal(regularLogin.status,200);
 cookie=regularLogin.headers.get('set-cookie')?.split(';')[0]||'';assert.ok(cookie.includes('atletica_session='));
 const adminBlocked=await request('/api/admin/users');assert.equal(adminBlocked.status,403);
 const financeBlocked=await request('/api/records/transactions');assert.equal(financeBlocked.status,403);
 const eventBlocked=await request('/api/records/events','POST',{name:'Evento indevido CI',startsAt:new Date(Date.now()+86400000).toISOString(),status:'PLANNING',departmentId:dept.id});assert.equal(eventBlocked.status,403);
});
