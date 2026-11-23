# Gato — prévia gratuita Render + Neon

**Ambiente alternativo à Oracle (criado em 2026-11-22)**

- Render: serviço Web `gato-atletica-os`, plano **Free**, runtime Docker, região Virginia, branch GitHub `main`, URL `https://gato-atletica-os.onrender.com`.
- Banco: projeto Neon **Gato**, org Gato Atletica, branch `production`, região São Paulo. Não usar Render Postgres.
- Dockerfile: Next.js standalone + Prisma 6, Node 22; sem servidor ou banco rodando permanentemente no PC pessoal.
- `DATABASE_URL` pooled da Neon configurada e salva no **Environment** privativo do Render, com TLS obrigatório. `APP_URL` e `SESSION_COOKIE_NAME` configuradas. Nenhuma credencial foi enviada ao GitHub.
- Migrações inicial e Gato 2.0 aplicadas na Neon; 27 tabelas confirmadas (23 modelos anteriores, 3 modelos de workspace e histórico Prisma), sete diretorias e dez categorias financeiras preservadas. Conta administrativa inicial já criada; não distribuir senhas no repositório.

## Verificação operacional concluída

Em 2026-11-22, o Render confirmou a atualização Gato 2.0 (`dad8121`, deploy `dep-dc1olsl9fdbs73beavbg`) como live, com `/login` HTTP 200 e `/api/health` HTTP 200 (database connected), `/app/espacos` redirecionando para login sem sessão e API privada 401. O Docker mantém `HOSTNAME=0.0.0.0`. Conta administrativa inicial existe; os fluxos novos foram validados em CI com PostgreSQL efêmero, mas não foi feita uma edição autenticada diretamente no banco de produção.

## Limitações que impedem tratar o Free como produção institucional

1. **Suspensão após 15 min ociosos**; primeiro acesso pode demorar cerca de 1 minuto. Cota de **750 horas gratuitas por workspace por mês**, compartilhada com outros serviços Free, incluindo BlueScale. O consumo de um serviço pode limitar outros.
2. **Disco efêmero**: arquivos enviados localmente somem em cada reinício/redeploy/spin-down. A aplicação bloqueia uploads quando o host indica Render e `PERSISTENT_UPLOADS` não foi habilitado. Use cadastro de documentos com links externos, ou implemente armazenamento S3 compatível antes de habilitar uploads.
3. O Render Free não oferece shell interativo nem disco persistente. Bootstrap e migrações devem ser executados em processo externo autorizado ou em deploy controlado. **Nunca exponha credenciais administrativas no repositório.**
4. A Neon fica em São Paulo e Render na Virginia, produzindo latência de rede adicional. Avalie se necessário mover para um host mais próximo sem mexer no banco original.

## Verificações antes do uso

- Acesse `https://gato-atletica-os.onrender.com/api/health` e valide resposta HTTP (200 e database connected verificados no deploy `dep-dc1ops7f3r2c73dajqu0`).
- Verifique que `/login` renderiza uma página real.
- A conta administrativa inicial existe. Rotacione qualquer senha temporária exposta em chats; valide cookies Secure, login/logout e RBAC.
- Exercite CRUD de eventos, membros, financeiro e fluxo disciplinar com contas distintas; revise os espaços e as páginas na interface lunar após o deploy.
- Teste cadastro de documento com URL externa e confirme que uploads locais retornam erro explícito.
- Documente custo, limitações e política de backups/snapshot Neon, antes de convidar diretoria.

**Esta é uma prévia para desenvolvimento e homologação, não hospedagem institucional com garantia de disponibilidade.** Render desaconselha plano Free para produção; uma opção paga sempre ativa começa em US$ 7/mês (preço público sujeito a alterações).
