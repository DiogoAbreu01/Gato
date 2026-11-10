# Implantação do Gato na Oracle Cloud

Destino oficial: VM Ubuntu ARM64 ou x86_64 (Oracle Cloud Always Free, quando houver capacidade) com Docker Compose, PostgreSQL e Caddy/HTTPS. **Não utilizar GitHub Pages nem Codespaces como hospedagem.**

## Estado

Ainda não há instância Oracle criada nem aplicativo online. O repositório contém apenas documentação e configuração de desenvolvimento até que o código-fonte completo seja enviado. O pacote original com o aplicativo foi entregue na conversa do ChatGPT.

## Implantação

1. Criar instância Linux elegível no console OCI com chave pública SSH; manter a chave privada no computador.
2. Configurar NSG/Security List para TCP 80/443 e SSH 22 restrito ao IP administrativo; não expor 3000 nem 5432.
3. Enviar arquivos extraídos do pacote original para `~/gato` na VM (ou publicar o código completo no repositório e clonar).
4. Executar `deploy/oracle-setup.sh` (incluído no pacote preparado para Oracle) no Ubuntu, reconectar ao SSH.
5. Configurar `.env` com `POSTGRES_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DOMAIN`, `APP_URL` e armazenamento remoto de backup. **Nunca versionar .env**.
6. Configurar DNS A para o IP público. Iniciar: `docker compose -f compose.yaml -f deploy/compose.proxy.yaml up -d --build`.
7. Verificar `docker compose ps`, logs e `curl -f http://127.0.0.1:3000/api/health`; depois testar login, acesso, alterações, backups e restauração.

A Oracle Cloud não possui integração autorizada neste chat; não é possível criar a VM por aqui sem acesso à conta/instância. A entrega preparada para Oracle inclui o guia `ORACLE.md` e o script `deploy/oracle-setup.sh`.
