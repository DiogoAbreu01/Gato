# Gato — auditoria manual e testes de regressão

Data: 2026-11-22 (America/Sao_Paulo). Ambiente: PC de Itajubá via Desktop Commander; site real Render + Neon. Nenhum servidor ou banco permanente no computador.

## Método
- Navegador Playwright Chromium rodando no PC: desktop 1440 px, tablet 768 px, celular 390 px e compacto 320 px, com screenshots e monitoramento de exceções JS.
- Conta QA temporária com papel GENERAL e acesso de diretor somente a uma diretoria isolada marcada [QA]; sem permissões administrativas globais. Não alterar cadastros ou finanças reais.
- Fluxos: login, espaços por diretoria, criar página, inserir blocos, aguardar autosave, recarregar, abrir seletor, criar planilha, criar fluxograma e revisar versão móvel.
- Testes de fórmulas e CSV, compilação, lint, checagem de tipos, CI com PostgreSQL efêmero.

## Comportamentos verificados
- Login público HTTP 200 nas resoluções 320, 390, 768, 1440; sem overflow horizontal nem erros JavaScript.
- Saúde da API HTTP 200, logo SVG HTTP 200, rotas privadas exigindo sessão e API de páginas sem sessão respondendo 401.
- Login temporário QA e criação real de conteúdo via navegador. Nenhum dado real da Atlética foi editado.
- A interface exibiu dois seletores de blocos simultaneamente ao clicar no botão de inserir após o último bloco. No reteste do deploy d53f0ba, somente um menu apareceu.
- Reteste autenticado após aguardar PATCH HTTP 200: planilha com SUM autorreferente exibiu #CYCLE e persistiu após reload; fluxograma manteve dois nós após reload; mobile 390px sem overflow; nenhuma exceção JS.

## Bugs e correções
| ID | Severidade | Evidência | Ajuste |
|---|---|---|---|
| QA-001 | Média | Reprodução visual de menu de blocos duplicado após último bloco | Limitar o seletor intermediário, manter menu final único e posicionar abaixo do bloco |
| QA-002 | Alta | Cálculos circulares em SUM podiam retornar zero silenciosamente | Evaluador detecta #CYCLE, #REF e #DIV/0, suporta colunas AA até AD |
| QA-003 | Média | Botão Salvar agora alterava debounce de 1300 ms para 30 ms por tempo indeterminado | Aceleração pontual e proteção ao sair com alterações |
| QA-004 | Alta (segurança) | Exportação CSV permitia textos que acionam fórmulas em leitores de planilhas | Neutralizar conteúdo iniciando com =, +, - ou @ e exportar resultados calculados com segurança |
| QA-005 | Baixa | Comando / deixava barra no textarea | PreventDefault ao abrir menu com texto vazio |
| QA-006 | Alta (perda de dados) | Navegação SPA via links do Next.js não dispara beforeunload e podia descartar edição enquanto autosave estava pendente | Confirmar antes de navegação interna ou logout quando existir alteração não salva |

## Regressão
- tests/sheet-math.test.mjs cobre cálculos, ciclos, colunas AA..AD e proteção CSV.
- Rodada local com 13 testes aprovados e 1 smoke ignorado localmente; typecheck, lint e build de produção executados. GitHub Actions 45102709272 e 45103560591 concluídos com sucesso (integração PostgreSQL efêmera).
- Retestes de produção: menu único, 1 PATCH na digitação, SUM circular #CYCLE persistindo após recarregar, 2 nós de fluxograma persistidos, editor mobile sem overflow, zero exceções JS. API health repetida 8 vezes: todas 200 com banco conectado.
- Deploys Render verificados live: d53f0ba (regressões de editor/planilha) e 153c402 (proteção de navegação).
- Para testes HTTP integrados, GitHub Actions usa PostgreSQL efêmero em nuvem.

## Limitações
- Render Free pode suspender após ociosidade.
- **Limpeza executada e verificada em Neon**: 3 páginas, 7 revisões e a conta temporária/diretoria isolada foram apagadas em transação com COMMIT. Consulta final retornou qa_users=0 e qa_departments=0. Dados institucionais preservados.
- O alerta de alterações não salvas foi validado no navegador real após deploy 153c402: exibiu 1 confirmação, impediu sair ao cancelar, salvou via PATCH HTTP 200 e depois navegou normalmente.
- Módulos financeiros e disciplinares precisam de homologação específica sem dados reais.
- O aviso de libunwind.dll no PC vem de outro aplicativo Windows chamado cometa_contacts_tests.exe, não do Gato.
- Logs do Render tiveram mensagens ocasionais de conexão PostgreSQL encerrada, não reproduzidas como indisponibilidade no teste de saúde 8/8. Monitorar recorrência sem classificar como falha resolvida.
