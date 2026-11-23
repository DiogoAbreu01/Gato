# Gato 2.0 — Moon Workspace

## Visão de produto
Gato é um workspace operacional da Atlética. A versão 2 combina os módulos transacionais existentes (financeiro, membros, eventos, tarefas, comunicação, eSports, DGE e controle de acessos) com uma estrutura estilo Notion: espaços por diretoria, páginas e subpáginas, editores de conteúdo, bancos de dados dinâmicos, planilhas e fluxogramas.

## Design system
- Identidade visual: gato lunar com óculos (asset vetorial autoral em `public/gato-lunar.svg`), linguagem limpa e adulta.
- Paleta padrão escura: `#0b0c14` (fundo), `#141621` (superfície), `#f3f2fa` (texto), `#a4a7bc` (muted), `#b4b8ff` (lavanda), `#2b2e40` (divisórias).
- Tema claro opcional, salvo na preferência do navegador.
- Componentes responsivos, acessibilidade básica por semântica e estados de foco.

## Modelo de dados
- `WorkspacePage` — pertence a exatamente uma `Department`, pode ter `parentId` para formar árvore no próprio espaço, quatro tipos: `PAGE`, `SHEET`, `DATABASE`, `FLOW`. Guarda blocos em `content` JSON e configuração de views/nós/células em `data` JSON.
- `WorkspacePageRevision` — uma revisão por `(pageId,version)`, contendo snapshot do título, blocos e dados. Atualizações incrementam `version` e gravam auditoria.
- `WorkspacePageFavorite` — favoritos por usuário com PK `(pageId,userId)`.
- Restrição por diretoria: leitura só para ADMIN/BOARD ou membro da área; escrita só para ADMIN/BOARD ou DIRECTOR/EDITOR da área. Operações sensíveis verificadas no servidor.
- Soft delete de páginas. Páginas com filhas ativas não podem ser arquivadas (evita órfãos).
- Migração `20261122000100_workspace_v2` é aditiva, sem DROP/DELETE dos dados administrativos existentes.

## APIs reais
- `GET /api/workspace/pages?departmentId=UUID`: listagem autorizada e favoritos.
- `POST /api/workspace/pages`: cria, valida tipo, área, hierarquia e permissão.
- `GET /api/workspace/pages/:id`: carrega dados e últimas revisões.
- `PATCH /api/workspace/pages/:id`: CAS por versão, Zod, grava revisão/auditoria.
- `DELETE /api/workspace/pages/:id`: arquiva sem apagar histórico.
- `POST /api/workspace/pages/:id/favorite`: alterna favorito com acesso validado.
- Todas as mutações verificam sessão e origem; retornos esperados: 401 sem sessão, 403 sem acesso, 409 concorrência, 422 validação.

## Interface MVP implementada
- `/app/espacos`: espaços acessíveis, total de páginas por área.
- `/app/espacos/:departmentId`: árvore de páginas, criar subpáginas, buscar localmente, tipos.
- `/app/espacos/p/:id`: editor dinâmico com autosave e alerta de conflitos.
- Blocos: parágrafos, títulos, tarefas, listas, citações, divisores e links.
- Planilhas: até 30 colunas × 250 linhas, filtros, exportação CSV, fórmula básica SUM e aritmética.
- Banco de dados: tabela e Kanban por coluna de status com alteração do cartão.
- Fluxogramas: até 80 nós e 150 relações; mover nós, conectar, renomear, excluir, salvar.
- Busca de títulos e favoritos pelo menu lateral.
- O core financeiro/administrativo permanece operacional e isolado do conteúdo flexível.
- Perfil e rotação de senha: `/app/perfil` permite troca da senha atual por outra com mínimo de 16 caracteres, invalidando sessões anteriores e registrando apenas metadados de auditoria.

## Critérios de validação
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- GitHub Actions com PostgreSQL efêmero: migrar e criar admin, login, CRUD transacional, criar/editar página, conflito 409, subpáginas, favoritos, planilha, flowchart e tentativa de acesso indevido.
- Backup/snapshot Neon antes da migração; aplicação da migração aditiva no banco da produção **antes** do merge na main.
- Após deploy: testar `/api/health`, `/login`, `/app`, `/app/espacos` e operações autenticadas. Não usar PC como servidor.

## Fora desta entrega e melhorias futuras
- Editor WYSIWYG completo com Markdown, comentários, colaboração multiusuário em tempo real, relações automáticas entre bases, fórmulas complexas do Excel, importação/exportação XLSX, anexos S3 e diagramas avançados de grande escala.
- Performance além de 500 páginas por espaço e filtros avançados server-side.
- Restauração assistida de versões específicas na UI (o histórico é persistido, mas a recuperação usa a API/admin por enquanto).
- O Render Free dorme sem tráfego, compartilha cotas com outros serviços e não oferece disco persistente. Usar serviço estável antes de operar dados institucionais críticos.

## Deploy
Pipeline recomendado: push branch feature → CI → migração Neon → merge main → Render auto deploy → smoke HTTP → revisão de acessos. Nunca inserir URL do banco, senhas ou informações pessoais em commits ou logs.
