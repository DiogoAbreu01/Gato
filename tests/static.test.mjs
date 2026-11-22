import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=(p)=>readFileSync(path.join(root,p),'utf8');
test('modelagem contém relações, índices, histórico e financeiro auditável',()=>{
 const s=read('prisma/schema.prisma');
 for(const key of ['model User','model MemberDepartment','model Session','model MemberStatusHistory','model AuditLog','model FinancialTransaction','model DisciplinaryAdjustment','model Notification','model Document'])assert.ok(s.includes(key),key);
 assert.ok(s.includes('reversalOfId'));
 assert.ok(s.includes('version      Int @default(1)'));
});
test('as rotas de mutação exigem sessão e validação de origem',()=>{
 for(const p of ['src/app/api/records/[resource]/route.ts','src/app/api/records/[resource]/[id]/route.ts','src/app/api/admin/users/route.ts','src/app/api/documents/upload/route.ts']){
  const source=read(p);assert.ok(source.includes('actorFromSession'),p);assert.ok(source.includes('sameOrigin'),p);
 }
});
test('infraestrutura, backup e restauração isolada presentes',()=>{
 for(const p of ['Dockerfile','compose.yaml','prisma/migrations/20261110000000_init/migration.sql','deploy/Caddyfile','scripts/backup.sh','scripts/verify-restore.sh'])assert.ok(existsSync(path.join(root,p)),p);
 const sql=read('prisma/migrations/20261110000000_init/migration.sql');
 assert.ok(sql.includes('CREATE TABLE "Member"'));
 assert.ok(sql.includes('FOREIGN KEY'));
});
test('documentos não são arquivos servidos de pasta pública',()=>{
 const get=read('src/app/api/documents/[id]/download/route.ts');
 assert.ok(get.includes('actorFromSession'));
 assert.ok(get.includes("can(actor,'documents','read'"));
 assert.ok(get.includes('no-store'));
});
