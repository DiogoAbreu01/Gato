# Gato 🐈

Sistema administrativo de Atlética universitária (antigo Atlética OS).

## Status

Repositório inicializado para receber a fundação do projeto. **O código do aplicativo ainda não está neste repositório.** Não é uma implantação em produção.

## Importar o aplicativo

1. Baixe o pacote `atletica-os-fundacao.zip` fornecido na conversa do ChatGPT.
2. Extraia os arquivos no computador (não envie o ZIP fechado como se fosse o app).
3. Faça upload do conteúdo extraído para a raiz deste repositório, preservando pastas como `src/`, `prisma/`, `tests/` e `deploy/`.
4. Mantenha `.env`, `node_modules/`, senhas e dados privados **fora** do repositório.
5. Abra **Code → Codespaces → Create codespace on main**.
6. No terminal do Codespaces: crie `.env` a partir de `.env.example` e configure as credenciais; execute `docker compose up -d --build`.
7. Consulte o README original do aplicativo e valide migrações, bootstrap, testes e saúde da aplicação antes de compartilhar o endereço.

O Codespaces é ambiente de desenvolvimento temporário, não hospedagem 24/7. Para publicar a versão estável, use uma VM com HTTPS, backups e banco persistente.

**Atenção:** o repositório foi criado como público. Recomenda-se torná-lo privado antes de subir dados ou arquivos internos. Não publique informações reais de membros nem credenciais em nenhuma hipótese.
