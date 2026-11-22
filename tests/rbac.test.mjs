import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
let ts;
try {ts=require('typescript')} catch {ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const source=readFileSync(path.resolve(import.meta.dirname,'../src/lib/rbac.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
new Function('module','exports','require',js)(mod,mod.exports,require);
const {can,readFilter,canChangeMember}=mod.exports;
const dep=(departmentId,key,role)=>({departmentId,key,role});
const admin={id:'admin',globalRole:'ADMIN',departments:[]};
const board={id:'board',globalRole:'BOARD',departments:[]};
const publicity={id:'pub',globalRole:'GENERAL',departments:[dep('pubdep','publicidade','EDITOR')]};
const finance={id:'fin',globalRole:'GENERAL',departments:[dep('findep','financeiro','DIRECTOR')]};
const people={id:'people',globalRole:'GENERAL',departments:[dep('peopledep','pessoas','DIRECTOR')]};
const general={id:'general',globalRole:'GENERAL',departments:[]};
test('administrador tem acesso administrativo completo',()=>{
 assert.equal(can(admin,'transactions','manage','findep'),true);
 assert.equal(can(admin,'occurrences','write','pubdep'),true);
});
test('diretoria geral pode ler ocorrências, mas não alterá-las',()=>{
 assert.equal(can(board,'occurrences','read'),true);
 assert.equal(can(board,'occurrences','write','pubdep'),false);
});
test('publicidade não acessa o financeiro; financeiro controla os lançamentos',()=>{
 assert.equal(can(publicity,'transactions','read'),false);
 assert.equal(can(publicity,'transactions','write','pubdep'),false);
 assert.equal(can(finance,'transactions','read'),true);
 assert.equal(can(finance,'transactions','manage','findep'),true);
});
test('gestão de pessoas tem escopo disciplinar centralizado e auditado',()=>{
 assert.equal(can(people,'occurrences','write','pubdep'),true);
 assert.equal(can(publicity,'occurrences','read','pubdep'),false);
 assert.deepEqual(readFilter(people,'occurrences'),{});
 assert.equal(canChangeMember(people,['pubdep']),true);
});
test('membro geral só consulta tarefas atribuídas',()=>{
 assert.equal(can(general,'tasks','read'),true);
 assert.equal(can(general,'tasks','write','findep'),false);
 assert.deepEqual(readFilter(general,'tasks'),{OR:[{departmentId:{in:[]}},{assigneeId:'general'}]});
});
