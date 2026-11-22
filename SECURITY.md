# Segurança e privacidade

Implementado no código: hash bcrypt com fator 12 para senhas, sessões opacas com token aleatório, token armazenado somente em SHA-256, cookie HttpOnly/SameSite Strict/Secure em produção, expiração, revogação de sessão, proteção de origem em mutações, throttling por identificação de e-mail, validação Zod, permissão por entidade/diretoria, auditoria de mudanças e arquivos privados com download autenticado.

**Antes de produção:** testar autorização nos cenários cruzados de diretoria, rate limiting por IP em proxy confiável, proteção contra brute force distribuído, política LGPD (base legal, retenção, transparência e direitos dos titulares), anonimização, gerenciamento de segredos, rollback/restore e revisão de headers/proxy. Não logar tokens, senhas ou campos pessoais. A auditoria guarda campos alterados, não os valores privados.

Documentos: PDFs/imagens/Office/texto permitidos até 10MB, verificação mínima de assinatura, salvos fora de `/public`. Não há antivírus; adicionar verificação antes de aceitar arquivos não confiáveis em produção.

Ocorrências: fluxo básico de pontos e correções. Não há penalidade automática, expiração ou consequência aplicada. Regras disciplinares devem ser aprovadas pela Atlética.

URL de implantação: `APP_URL` deve ser o endereço externo HTTPS exato para proteção CSRF. Configure Caddy e restrinja firewall. Execute `npm audit` e revise patches antes de publicar.
