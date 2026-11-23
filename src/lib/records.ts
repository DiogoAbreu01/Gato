import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { schemas, modules } from '@/lib/modules';
import { can, canChangeMember, readFilter, type Actor, type Resource } from '@/lib/rbac';

export class HttpFailure extends Error { constructor(public status: number, message: string) { super(message); } }
export function getSpec(resource: string) {
  if (!Object.prototype.hasOwnProperty.call(modules, resource)) throw new HttpFailure(404, 'Módulo inexistente');
  const spec = modules[resource as Resource];
  if (!spec) throw new HttpFailure(404, 'Módulo inexistente');
  return spec;
}
const stripPrivateMember = (item:any,actor:Actor) => ({...item,contact: actor.globalRole === 'ADMIN' || actor.globalRole === 'BOARD' || actor.departments.some(d=>d.role==='DIRECTOR' && (d.key==='pessoas' || item.departments.some((m:{departmentId:string})=>m.departmentId===d.departmentId))) ? item.contact : null });
const client = (tx: Prisma.TransactionClient | typeof prisma, model: string): any => (tx as unknown as Record<string, any>)[model];
const publishedFilter = (spec: ReturnType<typeof getSpec>) => spec.archive ? { archivedAt: null } : {};

export async function listRecords(resource: string, actor: Actor, page = 0, q = '') {
  const spec = getSpec(resource);
  if (!can(actor, spec.resource, 'read')) throw new HttpFailure(403, 'Sem acesso');
  const filters = { ...readFilter(actor, spec.resource), ...publishedFilter(spec) };
  const searchKey = resource === 'members' || resource === 'events' || resource === 'teams' || resource === 'tournaments' || resource === 'departments' || resource === 'accounts' || resource === 'categories' ? 'name' : resource === 'transactions' ? 'description' : resource === 'occurrences' ? 'type' : 'title';
  const where = q ? { AND: [filters, { [searchKey]: { contains: q.slice(0,100), mode: 'insensitive' } }] } : filters;
  const model = client(prisma, spec.model);
  const include = resource === 'members' ? { departments: { select: { departmentId: true } } } : undefined;
  const [items,total] = await prisma.$transaction([
    model.findMany({ where, include, orderBy: resource === 'departments'||resource === 'accounts'||resource === 'categories' ? { name: 'asc' } : { createdAt: 'desc' }, skip: Math.max(0,page)*25, take:25 }),
    model.count({ where })
  ]);
  return { items: items.map((item: any) => resource === 'members' ? { ...stripPrivateMember(item,actor), departmentIds: item.departments.map((d: {departmentId:string}) => d.departmentId) } : item), total, page, pageSize:25 };
}

export async function oneRecord(resource: string, id: string, actor: Actor) {
  const spec = getSpec(resource);
  if (!can(actor, spec.resource, 'read')) throw new HttpFailure(403, 'Sem acesso');
  const item = await client(prisma, spec.model).findFirst({ where: { id, ...readFilter(actor,spec.resource), ...publishedFilter(spec) }, include: resource === 'members' ? { departments: { select: { departmentId: true } } } : undefined });
  if (!item) throw new HttpFailure(404, 'Registro não encontrado');
  return resource === 'members' ? { ...stripPrivateMember(item,actor), departmentIds: item.departments.map((d: {departmentId:string}) => d.departmentId) } : item;
}

async function checkLinks(tx: Prisma.TransactionClient, resource:string, data:Record<string,any>, actor:Actor) {
  if (data.departmentId) {
    const dep = await tx.department.findUnique({where:{id:data.departmentId}});
    if (!dep?.active) throw new HttpFailure(400, 'Diretoria inativa ou inexistente');
  }
  if (resource === 'tasks' || resource === 'publications' || resource === 'transactions') {
    if (data.eventId) {
      const event = await tx.event.findUnique({where:{id:data.eventId}});
      // Vínculo interdiretorias: metadados básicos do evento são compartilhados,
      // mas as operações continuam limitadas ao setor do registro dependente.
      if (!event || event.archivedAt) throw new HttpFailure(400, 'Evento inexistente ou arquivado');
    }
  }
  if (resource === 'occurrences') {
    const member = await tx.member.findUnique({where:{id:data.memberId},include:{departments:true}});
    if (!member || member.archivedAt || !member.departments.some(d=>d.departmentId===data.departmentId)) throw new HttpFailure(400,'Membro fora da diretoria informada');
  }
  if (resource === 'transactions') {
    const account = await tx.financialAccount.findUnique({where:{id:data.accountId}});
    if (!account?.active) throw new HttpFailure(422,'Conta financeira inexistente ou inativa');
    if (data.categoryId) {
      const category = await tx.financialCategory.findUnique({where:{id:data.categoryId},select:{id:true}});
      if (!category) throw new HttpFailure(422,'Categoria financeira inexistente');
    }
  }
}

export async function createRecord(resource: string, input: unknown, actor: Actor) {
  const spec = getSpec(resource);
  const parsed = schemas[spec.resource as Exclude<Resource,'notifications'>].safeParse(input);
  if (!parsed.success) throw new HttpFailure(422, parsed.error.issues.map(x => `${x.path.join('.')}: ${x.message}`).join('; '));
  const data: Record<string,any> = {...parsed.data};
  const departmentIds: string[] = resource === 'members' ? [...new Set(data.departmentIds)] : data.departmentId ? [data.departmentId] : [];
  if (resource === 'members' ? !canChangeMember(actor,departmentIds) : !can(actor,spec.resource,'write',data.departmentId)) throw new HttpFailure(403,'Sem permissão de edição');
  return prisma.$transaction(async tx => {
    if (resource === 'members') {
      const deps = await tx.department.count({where:{id:{in:departmentIds},active:true}});
      if (deps !== departmentIds.length) throw new HttpFailure(422,'Uma ou mais diretorias inválidas');
      delete data.departmentIds;
      data.departments = { create: departmentIds.map(departmentId => ({ departmentId })) };
      const created = await tx.member.create({data: data as any});
      await tx.memberStatusHistory.create({data:{memberId:created.id,toStatus:created.status,changedById:actor.id,reason:'Cadastro inicial'}});
      await tx.auditLog.create({ data: { userId:actor.id, action:'create', resource, recordId:created.id,details:{ fields: Object.keys(parsed.data) } } });
      return created;
    }
    await checkLinks(tx,resource,data,actor);
    if (resource === 'occurrences') {
      const points = await tx.disciplinaryOccurrence.aggregate({where:{memberId:data.memberId,archivedAt:null},_sum:{points:true,adjustmentPoints:true}});
      if ((points._sum.points || 0) + (points._sum.adjustmentPoints || 0) + data.points > 5) throw new HttpFailure(409,'A pontuação ultrapassaria o limite de cinco');
      data.registeredById = actor.id;
    }
    if (resource === 'transactions') data.createdById = actor.id;
    if (resource === 'tasks' && data.assigneeId) {
      const assignee = await tx.user.findUnique({where:{id:data.assigneeId}});
      if (!assignee?.active) throw new HttpFailure(422,'Responsável inexistente ou inativo');
    }
    const created = await client(tx,spec.model).create({ data });
    if (resource === 'tasks' && data.assigneeId && data.assigneeId !== actor.id) {
      await tx.notification.create({ data:{userId:data.assigneeId,title:'Nova tarefa atribuída',body:data.title,href:`/app/tasks?open=${created.id}`} });
    }
    await tx.auditLog.create({data:{userId:actor.id,action:'create',resource,recordId:created.id,details:{fields:Object.keys(parsed.data)}}});
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateRecord(resource: string, id: string, input: unknown, version: number, actor: Actor) {
  const spec = getSpec(resource);
  if (resource === 'transactions' || resource === 'occurrences') throw new HttpFailure(405,'Registros sensíveis são imutáveis; solicite estorno ou ajuste auditado');
  const parsed = schemas[spec.resource as Exclude<Resource,'notifications'>].safeParse(input);
  if (!parsed.success) throw new HttpFailure(422,parsed.error.issues.map(x=>x.message).join('; '));
  if (spec.archive || resource==='members') { if (!Number.isInteger(version) || version < 1) throw new HttpFailure(422,'Versão obrigatória'); }
  const data:Record<string,any> = {...parsed.data};
  return prisma.$transaction(async tx=>{
    let nextMemberDepartmentIds: string[] = [];
    const existing = await client(tx,spec.model).findUnique({ where:{id}, include: resource==='members' ? { departments:true }:undefined });
    if (!existing || ('archivedAt' in existing && existing.archivedAt)) throw new HttpFailure(404,'Registro não encontrado');
    if (resource === 'departments') data.key = existing.key; // a identidade técnica dos sete setores é imutável
    if (resource === 'members') {
      const oldIds:string[] = existing.departments.map((d:{departmentId:string})=>d.departmentId);
      const newIds:string[] = [...new Set<string>(data.departmentIds as string[])];
      if (!canChangeMember(actor,[...new Set([...oldIds,...newIds])])) throw new HttpFailure(403,'Sem permissão');
      const valid = await tx.department.count({where:{id:{in:newIds},active:true}});
      if (valid !== newIds.length) throw new HttpFailure(422,'Diretoria inválida');
      delete data.departmentIds;
      if (actor.globalRole!=='ADMIN' && actor.globalRole!=='BOARD' && !actor.departments.some(d=>d.role==='DIRECTOR'&&(d.key==='pessoas'||oldIds.includes(d.departmentId)))) data.contact=existing.contact;
      nextMemberDepartmentIds = newIds;
      if (data.status!==existing.status) await tx.memberStatusHistory.create({data:{memberId:id,fromStatus:existing.status,toStatus:data.status,changedById:actor.id}});
    } else {
      if (!can(actor,spec.resource,'write',existing.departmentId) || !can(actor,spec.resource,'write',data.departmentId)) throw new HttpFailure(403,'Sem permissão');
      await checkLinks(tx,resource,data,actor);
    }
    if (spec.archive || resource==='members') {
      const result = await client(tx,spec.model).updateMany({where:{id,version},data:{...data,version:{increment:1}}});
      if (result.count !== 1) throw new HttpFailure(409,'Este registro foi alterado por outra pessoa. Atualize a página.');
    } else {
      await client(tx,spec.model).update({where:{id},data});
    }
    if (resource === 'members') {
      await tx.memberDepartment.deleteMany({where:{memberId:id}});
      await tx.memberDepartment.createMany({data: nextMemberDepartmentIds.map(departmentId=>({memberId:id,departmentId}))});
    }
    if (resource === 'tasks' && data.assigneeId && data.assigneeId !== existing.assigneeId && data.assigneeId !== actor.id) {
      await tx.notification.create({data:{userId:data.assigneeId,title:'Tarefa atribuída a você',body:data.title,href:`/app/tasks?open=${id}`}});
    }
    await tx.auditLog.create({data:{userId:actor.id,action:'update',resource,recordId:id,details:{fields:Object.keys(parsed.data),previousVersion:version}}});
    return client(tx,spec.model).findUnique({where:{id}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}

export async function removeRecord(resource:string,id:string,actor:Actor) {
  const spec = getSpec(resource);
  return prisma.$transaction(async tx=>{
    const existing=await client(tx,spec.model).findUnique({where:{id}, include:resource==='members'?{departments:true}:undefined});
    if (!existing) throw new HttpFailure(404,'Registro não encontrado');
    if (resource === 'transactions') {
      if (!can(actor,'transactions','manage',existing.departmentId)) throw new HttpFailure(403,'Estorno exige permissão administrativa');
      if (existing.status!=='POSTED' || existing.reversalOfId) throw new HttpFailure(409,'Lançamento não pode ser estornado');
      const reversed = await tx.financialTransaction.findUnique({where:{reversalOfId:id}});
      if (reversed) throw new HttpFailure(409,'Lançamento já estornado');
      const entry = await tx.financialTransaction.create({data:{description:`Estorno: ${existing.description}`,kind:existing.kind==='INCOME'?'EXPENSE':'INCOME',amount:existing.amount,occurredAt:new Date(),departmentId:existing.departmentId,eventId:existing.eventId,accountId:existing.accountId,categoryId:existing.categoryId,createdById:actor.id,reversalOfId:id,status:'POSTED'}});
      await tx.financialTransaction.update({where:{id},data:{status:'REVERSED'}});
      await tx.auditLog.create({data:{userId:actor.id,action:'reverse',resource,recordId:id,details:{reversalId:entry.id}}});
      return entry;
    }
    if (resource === 'occurrences') throw new HttpFailure(405,'Ocorrências só podem ser ajustadas com justificativa');
    if (resource === 'members') {
      if (!canChangeMember(actor,existing.departments.map((d:{departmentId:string})=>d.departmentId))) throw new HttpFailure(403,'Sem permissão');
    } else if (!can(actor,spec.resource,'manage',existing.departmentId)) throw new HttpFailure(403,'Sem permissão administrativa');
    if (!spec.archive) throw new HttpFailure(405,'Exclusão não disponível');
    if (existing.archivedAt) throw new HttpFailure(409,'Já arquivado');
    const archived = await client(tx,spec.model).update({where:{id},data:{archivedAt:new Date(),version:{increment:1}}});
    await tx.auditLog.create({data:{userId:actor.id,action:'archive',resource,recordId:id}});
    return archived;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
