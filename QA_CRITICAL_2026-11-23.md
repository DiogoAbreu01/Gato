# Gato — auditoria crítica de gestão
Data: 23/11/2026 (Brasil). Repositório: DiogoAbreu01/Gato.

## Escopo
Financeiro (lançamentos, contas, categorias e estornos), ocorrências disciplinares (justificativas, limite e ajustes), documentos (índice, URLs e download privado), controle de acesso entre diretorias, negação de acesso anônimo, autenticação, validação de origem, UI no computador de Itajubá e infraestrutura Render/Neon.

## Metodologia
- Código e testes preparados no PC de Itajubá por Desktop Commander.
- Banco PostgreSQL 16 **efêmero no GitHub Actions**, separado da Neon de produção.
- Novo teste tests/critical-flows.test.mjs, executado só com RUN_SMOKE=1 e APP_URL de CI.
- Criados no banco de CI usuários com papéis: financeiro DIRECTOR e EDITOR, pessoas DIRECTOR, publicidade EDITOR e VIEWER, usuário geral sem diretoria e usuário BOARD.
- Operações com IDs únicos de QA: criação/estorno/negação de lançamentos, restrição de categorias, membros/ocorrências/ajustes, documentos por link e upload de PDF e tentativas de acesso cruzado.
- Testes de autorização verificam respostas 401, 403, 404, 405, 409, 422 e 201, sem reutilizar dados pessoais.
- Módulos já testados na rodada anterior: workspace, editor de blocos, fluxogramas, autosave e planilhas.

## Achados confirmados e correções
| ID | Severidade | Falha reproduzida no CI | Correção |
|---|---|---|---|
| QA-007 | Média | Categoria financeira UUID inexistente resultava em erro interno HTTP 500 e violação de chave estrangeira | Checagem da categoria em transação antes de gravar; HTTP 422 com mensagem útil |
| QA-008 | Alta (disponibilidade) | Upload PDF sem campo descrição opcional recebia HTTP 422; o formulário atual não envia esse campo | Schema aceita null/undefined e upload ocorre sem descrição; cadastro e auditoria gravados na mesma transação |

## Cenários integrados que passaram
- Papel PUBLICIDADE não lança/consulta receitas financeiras e não pode forjar diretoria de um lançamento.
- Valores de transação zero/negativos e categorias inexistentes são rejeitados corretamente.
- EDITOR financeiro não consegue estornar; DIRECTOR estorna uma única vez, com lançamento compensatório imutável.
- Diretoria PESSOAS registra ocorrências somente para membro vinculado à diretoria informada.
- Adição de pontos respeita limite 0–5; ajuste registra justificativa; tentativa de superar máximo/mínimo retorna 409.
- BOARD pode consultar ocorrências mas não ajustar; visitantes sem papel não podem ler ou modificar registros disciplinares.
- Links de documentos aceitam HTTPS e recusam HTTP; VIEWER acessa documentos da própria área mas não os modifica.
- Usuário de outra diretoria não consegue visualizar, editar, arquivar ou baixar documentos privados.
- Upload de PDF sem descrição grava documento e trilha de auditoria e permite download somente ao setor autorizado.
- APIs sem sessão retornam 401 e mutações com Origin inválido são recusadas.

## Evidências e resultados
- GitHub Actions primeira execução 45105081162: falhou **intencionalmente** ao revelar QA-007 (500 vs 422) e QA-008 (422 vs 201).
- GitHub Actions segunda execução 45105300844: **success**; 19 testes aprovados, 0 falhas; inclui testes HTTP de integração e PostgreSQL real efêmero.
- Código corrigido em src/lib/records.ts, src/app/api/documents/upload/route.ts.
- TypeScript local passou; ESLint 0 erros, 2 avisos de configuração anteriores; 13 testes unitários locais aprovados; os smoke tests permanecem ignorados quando RUN_SMOKE não é ativado.
- Nenhum banco nem servidor de produção foi iniciado no PC do usuário.

## Limitações e próximos passos
- Render Free usa disco temporário; upload físico permanece **indisponível no serviço público** enquanto não houver storage persistente (API responde 503 intencionalmente). A correção de upload foi validada na infraestrutura CI; documentos por links HTTPS funcionam no Render.
- Testes de concorrência simultânea no estorno/ajustes e recuperação de backup não estão contemplados por esta suíte.
- O CI cria dados QA somente em banco efêmero; o banco institucional não recebeu transações nem ocorrências de teste.
- Revisar avisos de conexões PostgreSQL fechadas no log Render se houver falha HTTP reproduzida. Verificar cotas Neon/Render.
