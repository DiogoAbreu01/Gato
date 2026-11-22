import { z } from 'zod';
import type { Resource } from '@/lib/rbac';

export type Field = { key: string; label: string; type?: 'text'|'textarea'|'date'|'datetime'|'number'|'money'|'select'|'departments'|'lookup'|'checkbox'; required?: boolean; options?: { value: string; label: string }[]; lookup?: 'events'|'users'|'members'|'accounts'|'categories' };
export type ResourceSpec = { title: string; caption: string; model: string; fields: Field[]; resource: Resource; archive?: boolean; department?: boolean; icon: string };
const field = (key: string, label: string, type: Field['type'] = 'text', required = false, options?: Field['options']): Field => ({ key, label, type, required, options });
const dept = field('departmentId', 'Diretoria', 'select', true);
const date = (key: string, label: string, required = false) => field(key, label, 'datetime', required);
const sel = (key: string, label: string, pairs: string[]) => field(key, label, 'select', true, pairs.map(x => ({ value: x.split(':')[0], label: x.split(':').slice(1).join(':') })));

export const modules: Partial<Record<Resource, ResourceSpec>> = {
  departments: { title: 'Diretorias', caption: 'Setores da organização', resource: 'departments', model: 'department', icon: 'building', fields: [field('name','Nome', 'text', true), field('key','Identificador', 'text', true)] },
  members: { title: 'Gestão de pessoas', caption: 'Cadastro unificado, vínculos e histórico', resource: 'members', model: 'member', icon: 'users', archive: true,
    fields: [field('name','Nome completo','text',true), field('preferredName','Nome preferido'), field('nickname','Apelido'), field('enrollment','Matrícula'),field('course','Curso'),field('position','Cargo'),field('contact','Contato autorizado'), sel('status','Situação',['ACTIVE:Ativo','INACTIVE:Inativo','AWAY:Afastado','LEFT:Desligado']),field('departmentIds','Diretorias','departments',true)] },
  events: { title: 'Eventos', caption: 'Planejamento e execução de eventos', resource: 'events', model: 'event', icon: 'calendar', department: true, archive: true,
    fields: [field('name','Nome','text',true),field('description','Descrição','textarea'),field('type','Tipo'),field('venue','Local'),date('startsAt','Início',true),date('endsAt','Fim'),sel('status','Status',['PLANNING:Planejamento','APPROVAL:Aguardando aprovação','APPROVED:Aprovado','PREPARING:Preparação','ACTIVE:Em andamento','FINISHED:Finalizado','CANCELLED:Cancelado']),field('capacity','Capacidade','number'),field('budget','Orçamento (R$)','money'),dept] },
  tasks: { title: 'Tarefas', caption: 'Trabalho de todas as diretorias', resource: 'tasks', model: 'task', icon: 'check-square', department: true, archive: true,
    fields: [field('title','Título','text',true),field('description','Descrição','textarea'),sel('status','Status',['TODO:A fazer','DOING:Em andamento','REVIEW:Revisão','DONE:Concluído','CANCELLED:Cancelado']),field('priority','Prioridade (1 a 4)','number'),date('dueAt','Prazo'),field('eventId','Evento','lookup',false),field('assigneeId','Responsável','lookup'),dept] },
  transactions: { title: 'Financeiro', caption: 'Receitas, despesas e estornos auditáveis', resource: 'transactions', model: 'financialTransaction', icon: 'wallet', department: true,
    fields: [field('description','Descrição','text',true),sel('kind','Tipo',['INCOME:Receita','EXPENSE:Despesa']),field('amount','Valor (R$)','money',true),date('occurredAt','Data',true),field('accountId','Conta','lookup',true),field('categoryId','Categoria','lookup'),field('eventId','Evento','lookup'),dept] },
  publications: { title: 'Publicidade', caption: 'Agenda editorial e peças publicadas', resource: 'publications', model: 'publication', icon: 'megaphone', department: true, archive: true,
    fields: [field('title','Título','text',true),field('channel','Canal','text',true),field('caption','Legenda','textarea'),date('scheduledAt','Programado para'),sel('status','Etapa',['IDEA:Ideia','PRODUCTION:Produção','REVIEW:Revisão','APPROVED:Aprovado','SCHEDULED:Agendado','PUBLISHED:Publicado']),field('eventId','Evento','lookup'),dept] },
  teams: { title: 'Equipes eSports', caption: 'Line-ups e modalidades', resource: 'teams', model: 'esportsTeam', icon: 'gamepad', department: true, archive: true,
    fields: [field('name','Equipe','text',true),field('game','Modalidade','text',true),field('captain','Capitão'),field('roster','Line-up','textarea'),dept] },
  tournaments: { title: 'Campeonatos', caption: 'Competições e resultados', resource: 'tournaments', model: 'tournament', icon: 'trophy', department: true, archive: true,
    fields: [field('name','Nome','text',true),field('game','Jogo','text',true),field('organizer','Organizador'),date('startsAt','Início'),date('endsAt','Fim'),field('result','Resultado'),dept] },
  projects: { title: 'Projetos', caption: 'Projetos estratégicos e da DGE', resource: 'projects', model: 'project', icon: 'layers', department: true, archive: true,
    fields: [field('title','Título','text',true),field('description','Descrição','textarea'),field('status','Status','text',true),date('dueAt','Prazo'),dept] },
  documents: { title: 'Documentos', caption: 'Índice controlado de documentos; upload seguro na próxima fase', resource: 'documents', model: 'document', icon: 'file-text', department: true, archive: true,
    fields: [field('title','Nome do documento','text',true),field('description','Descrição','textarea'),field('externalUrl','URL de referência'),dept] },
  occurrences: { title: 'Ocorrências', caption: 'Registros disciplinares restritos; máximo de cinco pontos', resource: 'occurrences', model: 'disciplinaryOccurrence', icon: 'shield-alert', department: true,
    fields: [field('memberId','Membro','lookup',true),field('type','Tipo','text',true),field('justification','Justificativa','textarea',true),field('points','Pontos (0 a 5)','number',true),dept] },
  accounts: { title: 'Contas', caption: 'Contas financeiras internas', resource: 'accounts', model: 'financialAccount', icon: 'wallet', fields: [field('name','Nome','text',true)] },
  categories: { title: 'Categorias', caption: 'Classificação de lançamentos', resource: 'categories', model: 'financialCategory', icon: 'tag', fields: [field('name','Nome','text',true)] },
};

const optionalString = z.string().trim().max(1000).optional().nullable().transform(v => v || null);
const requiredString = z.string().trim().min(1).max(300);
const dateValue = z.string().datetime({ offset: true }).transform(v => new Date(v));
const optionalDate = dateValue.optional().nullable();
const money = z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().finite().nonnegative().max(9999999999.99)).transform(v => v.toFixed(2));
const uuid = z.string().uuid();
const optionalId = uuid.optional().nullable();
const status = <T extends [string, ...string[]]>(values:T) => z.enum(values);
const departmentId = { departmentId: uuid };
export const schemas = {
  departments: z.object({ name: requiredString, key: z.string().regex(/^[a-z][a-z0-9_-]{1,39}$/) }),
  members: z.object({ name: requiredString, preferredName: optionalString, nickname: optionalString, enrollment: optionalString, course: optionalString, position: optionalString, contact: optionalString, status: status(['ACTIVE','INACTIVE','AWAY','LEFT']), departmentIds: z.array(uuid).min(1).max(7) }),
  events: z.object({ name: requiredString, description: optionalString, type: optionalString, venue: optionalString, startsAt: dateValue, endsAt: optionalDate, status: status(['PLANNING','APPROVAL','APPROVED','PREPARING','ACTIVE','FINISHED','CANCELLED']), capacity: z.coerce.number().int().min(0).max(100000).nullable().optional(), budget: money.nullable().optional(), ...departmentId }).refine(v => !v.endsAt || v.endsAt >= v.startsAt, { message: 'O fim não pode preceder o início', path: ['endsAt'] }),
  tasks: z.object({ title: requiredString, description: optionalString, status: status(['TODO','DOING','REVIEW','DONE','CANCELLED']), priority: z.coerce.number().int().min(1).max(4), dueAt: optionalDate, eventId: optionalId, assigneeId: optionalId, ...departmentId }),
  transactions: z.object({ description: requiredString, kind: status(['INCOME','EXPENSE']), amount: money.refine(v => Number(v)>0,'O valor deve ser positivo'), occurredAt: dateValue, accountId: uuid, categoryId: optionalId, eventId: optionalId, ...departmentId }),
  publications: z.object({ title: requiredString, channel: requiredString, caption: optionalString, scheduledAt: optionalDate, status: status(['IDEA','PRODUCTION','REVIEW','APPROVED','SCHEDULED','PUBLISHED']), eventId: optionalId, ...departmentId }),
  teams: z.object({ name: requiredString, game: requiredString, captain: optionalString, roster: optionalString, ...departmentId }),
  tournaments: z.object({ name: requiredString, game: requiredString, organizer: optionalString, startsAt: optionalDate, endsAt: optionalDate, result: optionalString, ...departmentId }),
  projects: z.object({ title: requiredString, description: optionalString, status: requiredString, dueAt: optionalDate, ...departmentId }),
  documents: z.object({ title: requiredString, description: optionalString, externalUrl: z.union([z.string().url().max(2048).startsWith('https://'),z.literal('')]).optional().nullable().transform(v=>v||null), ...departmentId }),
  occurrences: z.object({ memberId: uuid, type: requiredString, justification: requiredString, points: z.coerce.number().int().min(0).max(5), ...departmentId }),
  accounts: z.object({ name: requiredString }),
  categories: z.object({ name: requiredString })
} satisfies Record<Exclude<Resource,'notifications'>, z.ZodTypeAny>;
