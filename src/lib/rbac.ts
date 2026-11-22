import type { DepartmentRole, GlobalRole } from '@prisma/client';

export type Verb = 'read' | 'write' | 'manage';
export type Actor = {
  id: string;
  globalRole: GlobalRole;
  departments: { departmentId: string; role: DepartmentRole; key?: string }[];
};
export type Resource = 'departments' | 'members' | 'events' | 'tasks' | 'transactions' | 'publications' | 'teams' | 'tournaments' | 'projects' | 'documents' | 'occurrences' | 'accounts' | 'categories' | 'notifications';

const directorOnly = new Set<Resource>(['occurrences']);
export const ALL_RESOURCES: Resource[] = ['departments','members','events','tasks','transactions','publications','teams','tournaments','projects','documents','occurrences','accounts','categories','notifications'];

export function allowedDepartmentIds(actor: Actor, resource: Resource, verb: Verb) {
  if (actor.globalRole === 'ADMIN' || actor.globalRole === 'BOARD') return null; // unrestricted by department, still checked at resource level
  return actor.departments.filter(d =>
    (resource !== 'transactions' || d.key === 'financeiro') &&
    (resource !== 'occurrences' || (d.key==='pessoas' && d.role === 'DIRECTOR')) &&
    (verb === 'read' || d.role === 'DIRECTOR' || d.role === 'EDITOR') &&
    (verb !== 'manage' || d.role === 'DIRECTOR')
  ).map(d => d.departmentId);
}

export function can(actor: Actor, resource: Resource, verb: Verb, departmentId?: string): boolean {
  if (actor.globalRole === 'ADMIN') return true;
  if (resource === 'notifications') return verb === 'read' || verb === 'write';
  if (resource === 'tasks' && verb === 'read' && !departmentId) return true; // tarefas individuais são filtradas por assigneeId no banco
  if (resource === 'departments') return verb === 'read' || actor.globalRole === 'BOARD';
  if (resource === 'occurrences' && actor.departments.some(d=>d.key==='pessoas'&&d.role==='DIRECTOR')) return true;
  if (resource === 'accounts' || resource === 'categories') {
    if (actor.globalRole === 'BOARD') return true;
    return actor.departments.some(d=>d.key==='financeiro' && (verb==='read'||d.role==='DIRECTOR'));
  }
  if (actor.globalRole === 'BOARD') return resource !== 'occurrences' || verb === 'read';
  if (resource === 'transactions' && verb === 'manage' && !actor.departments.some(d=>d.key==='financeiro'&&d.role==='DIRECTOR')) return false;
  if (directorOnly.has(resource) && verb !== 'read') {
    if (!departmentId) return false;
    return actor.departments.some(d => d.departmentId === departmentId && d.key === 'pessoas' && d.role === 'DIRECTOR');
  }
  if (resource === 'members' && actor.departments.some(d=>d.key==='pessoas'&&d.role==='DIRECTOR')) return true;
  // Departamento é obrigatório para operações de escrita; sem ele, somente leitura de listagem pode passar.
  const ids = allowedDepartmentIds(actor, resource, verb);
  if (departmentId) return ids !== null && ids.includes(departmentId);
  return ids !== null && ids.length > 0;
}

export function readFilter(actor: Actor, resource: Resource) {
  if (actor.globalRole === 'ADMIN' || actor.globalRole === 'BOARD' || ((resource==='members'||resource==='occurrences') && actor.departments.some(d=>d.key==='pessoas'&&d.role==='DIRECTOR'))) return {};
  if (resource === 'notifications') return { userId: actor.id };
  if (resource === 'departments' || resource === 'accounts' || resource === 'categories') return {};
  const ids = allowedDepartmentIds(actor, resource, 'read') ?? [];
  if (resource === 'members') return { departments: { some: { departmentId: { in: ids } } } };
  if (resource === 'tasks') return { OR: [{ departmentId: { in: ids } }, { assigneeId: actor.id }] };
  return { departmentId: { in: ids } };
}

export function canSeeMember(actor: Actor, departmentIds: string[]) {
  return actor.globalRole === 'ADMIN' || actor.globalRole === 'BOARD' || actor.departments.some(d=>d.key==='pessoas'&&d.role==='DIRECTOR') ||
    actor.departments.some(d => departmentIds.includes(d.departmentId));
}

export function canChangeMember(actor: Actor, departmentIds: string[]) {
  return actor.globalRole === 'ADMIN' || actor.globalRole === 'BOARD' || actor.departments.some(d=>d.key==='pessoas'&&d.role==='DIRECTOR') ||
    (departmentIds.length > 0 && departmentIds.every(id => can(actor, 'members', 'write', id)));
}
